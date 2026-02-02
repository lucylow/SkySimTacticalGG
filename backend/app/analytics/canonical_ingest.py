# app/analytics/canonical_ingest.py
"""
Stream consumer for canonical events (events:canonical).
Materializes rounds and macro_outcomes from ROUND_START/ROUND_END events.
"""
import asyncio
import json
import aioredis
import asyncpg
import logging
import uuid
from datetime import datetime
from app.settings import settings

logger = logging.getLogger("analytics.canonical")

REDIS_CANON = settings.CANONICAL_STREAM


async def consume_canonical(pool):
    """
    Consume canonical events from Redis stream and persist rounds/macro_outcomes.
    """
    r = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    group = "analytics_canon_group"
    consumer = settings.INGESTOR_NAME + "_canon"
    
    try:
        await r.xgroup_create(REDIS_CANON, group, id="$", mkstream=True)
    except Exception:
        pass  # group already exists
    
    logger.info(f"Starting canonical event consumer: {consumer}")
    
    while True:
        try:
            msgs = await r.xreadgroup(
                group, consumer,
                streams={REDIS_CANON: ">"},
                count=50,
                block=2000
            )
            if not msgs:
                await asyncio.sleep(0.2)
                continue
            
            for stream, entries in msgs:
                for message_id, data in entries:
                    try:
                        payload = json.loads(data.get("data", "{}"))
                        await process_canonical(payload, pool)
                        await r.xack(REDIS_CANON, group, message_id)
                    except Exception as e:
                        logger.exception(f"Failed to process canonical payload {message_id}: {e}")
        except Exception as e:
            logger.exception(f"Error in canonical consumer loop: {e}")
            await asyncio.sleep(1)


async def process_canonical(evt, pool):
    """
    Process canonical events: ROUND_START, ROUND_END, MAP_START, etc.
    Materializes rounds and macro_outcomes.
    """
    etype = evt.get("event_type")
    match_id = evt.get("match_id")
    map_id = evt.get("map_id") or evt.get("map")
    payload = evt.get("payload", {})
    
    if etype == "ROUND_START":
        round_no = payload.get("round") or payload.get("round_no") or evt.get("round")
        timestamp = evt.get("timestamp")
        
        # Parse timestamp
        round_start = None
        if timestamp:
            try:
                if isinstance(timestamp, str):
                    round_start = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                else:
                    round_start = timestamp
            except:
                pass
        
        async with pool.acquire() as conn:
            # Check if round already exists
            existing = await conn.fetchrow("""
                SELECT id FROM rounds WHERE match_id = $1 AND round_no = $2
            """, match_id, round_no)
            
            if existing:
                round_id = existing["id"]
                await conn.execute("""
                    UPDATE rounds 
                    SET round_start = $1, map_id = $2, meta = $3
                    WHERE id = $4
                """, round_start, map_id, json.dumps(evt), round_id)
            else:
                round_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO rounds (id, match_id, map_id, round_no, round_start, meta)
                    VALUES ($1, $2, $3, $4, $5, $6)
                """,
                    round_id,
                    match_id,
                    map_id,
                    round_no,
                    round_start,
                    json.dumps(evt)
                )
    
    elif etype == "ROUND_END":
        round_no = payload.get("round") or payload.get("round_no") or evt.get("round")
        timestamp = evt.get("timestamp")
        winner = payload.get("winner") or payload.get("winner_team")
        econ_snapshot = payload.get("economy") or payload.get("economy_snapshot") or {}
        site_exec = payload.get("site_executed", False)
        
        # Parse timestamp
        round_end = None
        if timestamp:
            try:
                if isinstance(timestamp, str):
                    round_end = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                else:
                    round_end = timestamp
            except:
                pass
        
        async with pool.acquire() as conn:
            # Check if round already exists
            existing = await conn.fetchrow("""
                SELECT id FROM rounds WHERE match_id = $1 AND round_no = $2
            """, match_id, round_no)
            
            if existing:
                round_id = existing["id"]
                await conn.execute("""
                    UPDATE rounds 
                    SET round_end = $1,
                        winner_team = $2,
                        site_executed = $3,
                        economy_snapshot = $4,
                        meta = $5
                    WHERE id = $6
                """, round_end, winner, site_exec, json.dumps(econ_snapshot), json.dumps(evt), round_id)
            else:
                round_id = str(uuid.uuid4())
                await conn.execute("""
                    INSERT INTO rounds (id, match_id, map_id, round_no, round_end, winner_team, site_executed, economy_snapshot, meta)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                    round_id,
                    match_id,
                    map_id,
                    round_no,
                    round_end,
                    winner,
                    site_exec,
                    json.dumps(econ_snapshot),
                    json.dumps(evt)
                )
            
            # Use round_id for macro_outcomes
            if round_id:
                
                # Extract teams from payload or use winner/opponent logic
                teams = []
                if payload.get("teamA") and payload.get("teamB"):
                    teams = [payload["teamA"], payload["teamB"]]
                elif winner:
                    # Try to infer opponent from match context
                    # For now, create outcomes for winner only if we can't determine both
                    teams = [winner]
                
                # Insert macro_outcomes per team
                for team in teams:
                    round_win = (team == winner) if winner else None
                    
                    # Calculate econ_delta if available
                    econ_delta = None
                    if isinstance(econ_snapshot, dict) and team in econ_snapshot:
                        team_econ = econ_snapshot.get(team, {})
                        # Simple delta calculation - adjust based on your econ structure
                        econ_delta = team_econ.get("delta") or team_econ.get("change", 0)
                    
                    outcome_id = str(uuid.uuid4())
                    await conn.execute("""
                        INSERT INTO macro_outcomes (
                            id, round_id, match_id, team, round_win, econ_delta,
                            site_executed, outcome_meta
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (round_id, team) DO UPDATE
                        SET round_win = EXCLUDED.round_win,
                            econ_delta = EXCLUDED.econ_delta,
                            site_executed = EXCLUDED.site_executed,
                            outcome_meta = EXCLUDED.outcome_meta
                    """,
                        outcome_id,
                        round_id,
                        match_id,
                        team,
                        round_win,
                        econ_delta,
                        site_exec,
                        json.dumps({"source": "round_end", "payload": payload})
                    )

