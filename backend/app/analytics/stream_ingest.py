# app/analytics/stream_ingest.py
"""
Stream consumer for micro_actions (events:agent:motion).
Listens to Redis streams and writes to Postgres.
"""
import asyncio
import json
import logging
import aioredis
import asyncpg
from datetime import datetime
from app.settings import settings

logger = logging.getLogger("analytics.ingest")

REDIS_STREAM_MICRO = "events:agent:motion"
REDIS_STREAM_CANON = settings.CANONICAL_STREAM


async def pg_connect():
    """Create asyncpg connection pool."""
    return await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=5)


async def consume_micro(pool):
    """
    Consume micro-action events from Redis stream and persist to Postgres.
    """
    r = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    group = "analytics_micro_group"
    consumer = settings.INGESTOR_NAME + "_micro"
    
    try:
        await r.xgroup_create(REDIS_STREAM_MICRO, group, id="$", mkstream=True)
    except Exception:
        pass  # group already exists
    
    logger.info(f"Starting micro-action consumer: {consumer}")
    
    while True:
        try:
            msgs = await r.xreadgroup(
                group, consumer,
                streams={REDIS_STREAM_MICRO: ">"},
                count=20,
                block=2000
            )
            if not msgs:
                await asyncio.sleep(0.2)
                continue
            
            for stream, entries in msgs:
                for message_id, data in entries:
                    try:
                        payload = json.loads(data.get("data", "{}"))
                        await persist_micro(payload, pool)
                        await r.xack(REDIS_STREAM_MICRO, group, message_id)
                    except Exception as e:
                        logger.exception(f"Failed to process micro entry {message_id}: {e}")
        except Exception as e:
            logger.exception(f"Error in micro consumer loop: {e}")
            await asyncio.sleep(1)


async def persist_micro(payload, pool):
    """
    Persist a micro-action event to the database.
    Handles flexible payload structure from agent motion signals.
    """
    async with pool.acquire() as conn:
        # Extract fields with flexible structure
        signal_id = payload.get("signal_id") or payload.get("id")
        match_id = payload.get("match_id")
        
        # Try to extract round_id from various locations
        round_id = (
            payload.get("round_id") or
            payload.get("motion_request", {}).get("meta", {}).get("round_id") or
            payload.get("meta", {}).get("round_id")
        )
        
        player_id = payload.get("player_id") or payload.get("player")
        team = (
            payload.get("team") or
            payload.get("motion_request", {}).get("meta", {}).get("team") or
            payload.get("meta", {}).get("team")
        )
        intent = payload.get("intent") or payload.get("motion_request", {}).get("intent")
        confidence = payload.get("confidence")
        
        # Extract features
        features = (
            payload.get("features") or
            payload.get("motion_request", {}).get("features") or
            {}
        )
        
        artifact_url = payload.get("artifact_url") or payload.get("artifact", {}).get("url")
        
        # Parse generated_at timestamp
        generated_at = None
        if payload.get("generated_at"):
            try:
                generated_at = datetime.fromisoformat(payload["generated_at"].replace("Z", "+00:00"))
            except:
                pass
        
        await conn.execute("""
            INSERT INTO micro_actions (
                signal_id, match_id, round_id, player_id, team, intent,
                confidence, features, artifact_url, generated_at, ingestion_meta
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (signal_id) DO NOTHING
        """,
            signal_id,
            match_id,
            round_id,
            player_id,
            team,
            intent,
            confidence,
            json.dumps(features),
            artifact_url,
            generated_at,
            json.dumps(payload)
        )


