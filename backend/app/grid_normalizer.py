# app/grid_normalizer.py
from app.schemas import GridRawEvent, CanonicalEvent
from pydantic import ValidationError
from datetime import datetime, timezone
from app.enricher import enrich_canonical
import uuid
import logging

logger = logging.getLogger(__name__)

async def normalize_grid_event(raw: dict) -> CanonicalEvent:
    """
    Convert GRID raw payload into canonical event, then run enrichment.
    """
    # validate shape minimally
    try:
        grid_evt = GridRawEvent(
            grid_event_id=raw.get("id") or raw.get("grid_event_id"),
            match_id=raw.get("match_id"),
            event_type=raw.get("type") or raw.get("event_type"),
            game_time=raw.get("game_time"),
            payload=raw.get("payload", raw),
            seq=raw.get("seq")
        )
    except ValidationError as e:
        logger.warning(f"Validation error for GridRawEvent; falling back. err={e}")
        # fallback to minimal structure
        grid_evt = GridRawEvent(
            grid_event_id=raw.get("id") or raw.get("grid_event_id"),
            match_id=raw.get("match_id", "unknown"),
            event_type=raw.get("type") or raw.get("event_type", "UNKNOWN"),
            game_time=raw.get("game_time"),
            payload=raw,
            seq=raw.get("seq")
        )

    # build canonical structure (choose event_id deterministically if possible)
    event_id = grid_evt.grid_event_id or f"{grid_evt.match_id}:{grid_evt.event_type}:{uuid.uuid4().hex}"
    timestamp = datetime.now(timezone.utc)
    # attempt to extract actor/target/team from GRID payloads (game-specific)
    actor = None
    target = None
    team = None
    p = grid_evt.payload

    # Improved Extraction Logic
    # 1. VALORANT specific
    if p.get("game") == "valorant" or "round_id" in p:
        actor = p.get("killer") or p.get("player_id") or p.get("activator")
        target = p.get("victim") or p.get("damaged_player")
        team = p.get("team") or p.get("attacker_team")

    # 2. League of Legends specific
    elif p.get("game") == "lol" or "participantId" in p:
        actor = p.get("killerId") or p.get("participantId") or p.get("creatorId")
        target = p.get("victimId") or p.get("targetId")
        team = p.get("teamId") or p.get("side")

    # 3. Common/Generic fallbacks
    else:
        if "killer" in p:
            actor = p.get("killer")
        if "victim" in p:
            target = p.get("victim")
        if "team" in p:
            team = p.get("team")
        if "player_id" in p and actor is None:
            actor = p.get("player_id")

    canonical = CanonicalEvent(
        event_id=event_id,
        match_id=grid_evt.match_id,
        event_type=grid_evt.event_type.upper(),
        timestamp=timestamp,
        actor=actor,
        target=target,
        team=team,
        payload=grid_evt.payload,
        enriched={},
        ingestion_meta={
            "source": "GRID",
            "grid_seq": grid_evt.seq,
            "ingested_at": timestamp.isoformat()
        }
    )

    # run enrichment (compute speeds, econ deltas, opening kills, etc.)
    try:
        enriched = await enrich_canonical(canonical)
        canonical.enriched = enriched
    except Exception as e:
        logger.warning(f"Enrichment failed for event_id={event_id}: {e}", exc_info=True)
        canonical.enriched = {}
    return canonical


