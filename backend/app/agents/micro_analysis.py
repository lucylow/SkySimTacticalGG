# app/agents/micro_analysis.py
import asyncio
import json
import time
import traceback
from datetime import datetime, timezone
from typing import Dict, Any, List
import aioredis
from app.settings import settings
from app.features import FeatureWindowManager, compute_features_from_event
from app.intent_model import IntentModel
from app.hy_motion_client import HYMotionClient, MotionRequest
from app.grid_storage import redis
from app.storage import upload_bytes
from app.persistence_hitl import create_review  # human-in-loop hook
from uuid import uuid4
import structlog

log = structlog.get_logger("micro_analysis")

# configuration
CANONICAL_STREAM = settings.CANONICAL_STREAM  # e.g., "events:canonical"
AGENT_SIGNALS_STREAM = "events:agent:motion"
HITL_CONF_THRESHOLD = 0.6  # below this confidence -> require human review

# instantiate helpers / clients
feature_manager = FeatureWindowManager(window_seconds=4.0)  # last 4s window
import os
_model_path = os.path.join(os.path.dirname(__file__), "..", "..", "models", "intent_model.joblib")
intent_model = IntentModel.load(_model_path)  # lightweight classifier/regressor
# Initialize HY-Motion client
# Supports: local inference (via HY_MOTION_REPO_PATH), REST API (via HY_MOTION_API_URL), or legacy CLI
hy_client = HYMotionClient(
    base_url=settings.HY_MOTION_API_URL if settings.HY_MOTION_API_URL else None,
    api_key=settings.HY_MOTION_API_KEY if settings.HY_MOTION_API_KEY else None,
    repo_path=settings.HY_MOTION_REPO_PATH if hasattr(settings, 'HY_MOTION_REPO_PATH') else None
)

# Intent mapping helpers
def map_intent_to_duration(intent: str, features: dict) -> float:
    mapping = {
        "advance": 1.8,
        "engage": 1.2,
        "hold": 1.5,
        "plant": 3.5,
        "defuse": 4.0,
        "rotate": 2.0,
        "peek": 0.8,
        "trade": 1.1
    }
    return mapping.get(intent, 1.5)

def map_intent_to_style(intent: str) -> str:
    if intent in ("advance","engage","peek"):
        return "aggressive"
    if intent in ("hold","defuse","plant"):
        return "deliberate"
    return "neutral"

def is_sensitive_intent(intent: str) -> bool:
    # For safety gating - e.g., large-impact animations or ambiguous ones.
    return intent in ("engage",) and False  # default False; adjust for policy

async def publish_stream_event(stream_name: str, payload: Dict[str, Any]):
    """Publish event to Redis stream."""
    r = await redis()
    await r.xadd(stream_name, {"data": json.dumps(payload)})

async def run_consumer():
    r = await redis()
    # set up consumer group
    group = "micro_analysis_group"
    stream = CANONICAL_STREAM
    try:
        await r.xgroup_create(stream, group, id="$", mkstream=True)
    except Exception:
        pass

    while True:
        try:
            entries = await r.xreadgroup(group, consumer_name=settings.INGESTOR_NAME, streams={stream: ">"}, count=10, block=1000)
            if not entries:
                continue
            for _stream_name, messages in entries:
                for message_id, msg in messages:
                    try:
                        data = json.loads(msg.get("data"))
                        await handle_canonical_event(data)
                        # ack the message
                        await r.xack(stream, group, message_id)
                    except Exception:
                        log.exception("failed to process event", event=msg)
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception("consumer loop error, sleeping briefly")
            await asyncio.sleep(1)

async def handle_canonical_event(evt: Dict[str, Any]):
    """
    Core processing for each canonical event:
    - update feature window
    - if event is relevant to motion (POSITION_UPDATE, KILL, OBJECTIVE, etc.) evaluate intents
    - when intent prediction fires, produce motion via HY-Motion
    - publish agent signal(s)
    """
    match_id = evt.get("match_id")
    actor = evt.get("actor")  # e.g., "player:alpha_p1"
    etype = evt.get("event_type")
    ts = evt.get("timestamp") or datetime.now(timezone.utc).isoformat()

    # Only process motion-relevant events
    motion_relevant_types = ("POSITION_UPDATE", "KILL", "DEATH", "OBJECTIVE", "ABILITY_USE", "ABILITY_CAST")
    if etype not in motion_relevant_types:
        return

    # Update sliding windows & derive features
    feature_manager.push_event(match_id, actor, evt)
    features = feature_manager.compute_features(match_id, actor)

    # Fast heuristic checks (very cheap) -> returns list of candidate intents with heuristic scores
    heuristics = feature_manager.evaluate_heuristics(match_id, actor, features)

    # If heuristics find a high-confidence intent, skip model; else use ML model
    candidate_intents = heuristics.copy()
    if not heuristics or max([h['score'] for h in heuristics], default=0) < 0.75:
        model_out = intent_model.predict(features)
        candidate_intents.append({
            "intent": model_out["intent"],
            "score": float(model_out["confidence"]),
            "explanation": model_out.get("explanation", "")
        })

    # pick top intent
    if not candidate_intents:
        return  # no intent detected
    
    top = sorted(candidate_intents, key=lambda x: x["score"], reverse=True)[0]
    intent = top["intent"]
    confidence = top["score"]

    log.info("predicted_intent", match_id=match_id, actor=actor, intent=intent, confidence=confidence)

    # Build HY-Motion request
    motion_req = MotionRequest(
        match_id=match_id,
        player_id=actor,
        intent=intent,
        features=features,
        duration_seconds=map_intent_to_duration(intent, features),
        style=map_intent_to_style(intent),
        meta={"predicted_by": "hybrid", "confidence": confidence, "event_ts": ts}
    )

    # If confidence too low or sensitive, create human review
    if confidence < HITL_CONF_THRESHOLD or is_sensitive_intent(intent):
        review_id = str(uuid4())
        # create human review entry (persisted to DB)
        create_review(review_id=review_id, run_id=f"{match_id}:{actor}", agent_name="motion_generator",
                      reason="low_confidence" if confidence < HITL_CONF_THRESHOLD else "sensitive_intent",
                      metadata={"intent": intent, "confidence": confidence, "features": features})
        # publish pending signal with review_id
        await publish_agent_signal(match_id, actor, intent, confidence, motion_req, review_required=True, review_id=review_id)
        log.info("human_review_created", review_id=review_id)
        return

    # Otherwise, call HY-Motion synth (this may be async/queued)
    try:
        # Option A: call synchronous REST and retrieve binary artifact
        synth_result = hy_client.generate_motion(motion_req)  # might block; in prod call via worker queue
        # synth_result: { "artifact_bytes": b'...', "format": "gltf", "meta": {...} }
        # store artifact in S3 (or object store)
        key = f"motions/{match_id}/{actor}/{int(time.time())}_{intent}.{synth_result['format']}"
        s3_url = upload_bytes(synth_result["artifact_bytes"], key, content_type=synth_result.get("content_type", "model/gltf+json"))
        # publish agent motion event
        await publish_agent_signal(match_id, actor, intent, confidence, motion_req, s3_url=s3_url, review_required=False)
    except Exception as e:
        log.exception("motion synthesis failed", error=str(e))
        # on failure, fallback: publish intent-only signal so UI can show predicted intent without animation
        await publish_agent_signal(match_id, actor, intent, confidence, motion_req, s3_url=None, error=str(e))

async def publish_agent_signal(match_id, actor, intent, confidence, motion_req: MotionRequest, s3_url=None, review_required=False, review_id=None, error=None):
    r = await redis()
    payload = {
        "signal_id": str(uuid4()),
        "type": "MOTION_SYNTHESIS",
        "match_id": match_id,
        "player_id": actor,
        "intent": intent,
        "confidence": confidence,
        "motion_request": motion_req.dict(),
        "artifact_url": s3_url,
        "review_required": review_required,
        "review_id": review_id,
        "error": error,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }
    await r.xadd(AGENT_SIGNALS_STREAM, {"data": json.dumps(payload)})
    # also emit to a WebSocket fanout or message bus as needed
    await publish_stream_event("agent.signals", payload)

