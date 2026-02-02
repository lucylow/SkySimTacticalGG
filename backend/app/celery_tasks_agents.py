# app/celery_tasks_agents.py
from app.celery_app import celery
from app.agents.registry import get_agent, auto_import_agents
from app.utils.message_bus import MessageBus
from app.utils.redis_client import get_redis
import structlog
import traceback
import json
import time
from uuid import uuid4
from app.persistence_hitl import create_review

log = structlog.get_logger()
message_bus = MessageBus()
auto_import_agents()  # ensure agent classes are registered

@celery.task(bind=True)
def run_agent_task(self, agent_name: str, payload: dict):
    """
    Generic Celery task to run any registered agent.
    - agent_name: name registered in app.agents.registry
    - payload: dict input for agent.run()
    Returns a serializable dict: {"agent": agent_name, "result": ..., "elapsed_s": ...}
    If payload contains "_spec_id", the task WILL publish its successful result to
    the Redis channel "speculative:{_spec_id}" so orchestrator can pick the first winner.
    """
    task_id = self.request.id
    message_bus.publish({"task_id": task_id, "stage": f"{agent_name}:start"})
    try:
        AgentCls = get_agent(agent_name)
        agent = AgentCls()
        t0 = time.time()
        raw_res = agent.execute(payload)  # should return dict with result/meta
        elapsed = time.time() - t0

        # normalize output
        out = {
            "agent": agent_name,
            "result": raw_res.get("result") if isinstance(raw_res, dict) else raw_res,
            "elapsed_s": elapsed
        }

        # publish general progress
        message_bus.publish({"task_id": task_id, "stage": f"{agent_name}:done", "agent": agent_name, "meta": out})

        # speculative publish (if orchestrator asked for it)
        try:
            spec_id = None
            if isinstance(payload, dict):
                spec_id = payload.get("_spec_id")
        except Exception:
            spec_id = None

        if spec_id:
            # Publish only on SUCCESS to the speculative channel so orchestrator can take first-winner.
            channel = f"speculative:{spec_id}"
            r = get_redis()
            pub = {"agent": agent_name, "result": out, "task_id": task_id}
            try:
                r.publish(channel, json.dumps(pub))
            except Exception as e:
                log.exception("failed to publish speculative result", error=str(e))

        # Decide whether to create a human review (HITL) for this result
        def needs_human_review(result: dict, payload: dict) -> bool:
            """
            Heuristics for whether to create a human review:
              - explicit payload flag: _require_human_review
              - low confidence threshold: payload may contain _human_confidence_threshold
              - sensitive artifact marker in payload
            Customize this to your policies.
            """
            try:
                if isinstance(payload, dict) and payload.get("_require_human_review"):
                    return True
            except Exception:
                pass
            try:
                # attempt to find a confidence value in result
                conf = None
                if isinstance(result, dict):
                    # support different shapes: result['confidence'] or result['result']['confidence']
                    conf = result.get("result", {}).get("confidence") if result.get("result") else result.get("confidence")
                if conf is None and isinstance(payload, dict):
                    # fallback to payload-provided metric
                    conf = payload.get("_confidence")
                if conf is not None:
                    threshold = float(payload.get("_human_confidence_threshold", 0.8)) if isinstance(payload, dict) else 0.8
                    try:
                        return float(conf) < threshold
                    except Exception:
                        pass
            except Exception:
                pass
            # default: no human review
            return False

        try:
            if needs_human_review(out, payload):
                # create human review entry (use persistence_hitl.create_review)
                review_id = str(uuid4())
                run_id = None
                try:
                    run_id = payload.get("run_id") or payload.get("_run_id") or out.get("result", {}).get("run_id")
                except Exception:
                    run_id = None
                create_review(review_id=review_id,
                              run_id=run_id or "",
                              agent_name=agent_name,
                              reason="auto_low_confidence" if out.get("result", {}).get("confidence") else "auto_flag",
                              metadata={"task_id": task_id, "agent_meta": out, "payload_summary": (payload if isinstance(payload, dict) else None)})
                # Notify UI / orchestrator via message bus
                message_bus.publish({"task_id": task_id, "event": "human_review.created", "review_id": review_id, "run_id": run_id, "agent_name": agent_name})
        except Exception as e:
            # don't fail the agent because of review creation problems; log and continue
            log.exception("error while creating human review", error=str(e))

        return out
    except Exception as e:
        tb = traceback.format_exc()
        message_bus.publish({"task_id": task_id, "stage": f"{agent_name}:error", "agent": agent_name, "error": str(e), "trace": tb})
        # re-raise so Celery marks the task failed
        raise

