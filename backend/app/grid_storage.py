# app/grid_storage.py
import json
import aioredis
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from app.db import SessionLocal
from app.models import RawEvent, CanonicalEventIndex
from app.settings import settings
from datetime import datetime
import logging
from tenacity import retry, wait_exponential, stop_after_attempt

logger = logging.getLogger(__name__)

_redis = None

@retry(wait=wait_exponential(multiplier=1, min=1, max=30), stop=stop_after_attempt(5))
async def redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        try:
            _redis = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}", exc_info=True)
            raise
    return _redis

def persist_raw_event(grid_event: dict, source: str = "GRID"):
    """
    Persist raw JSON to Postgres (append-only). Uses grid_event_id uniqueness for idempotency.
    """
    db = SessionLocal()
    try:
        if not grid_event:
            raise ValueError("grid_event cannot be empty")

        grid_event_id = grid_event.get("grid_event_id") or grid_event.get("id") or (f"{grid_event.get('match_id')}:{grid_event.get('seq')}" if grid_event.get('match_id') and grid_event.get('seq') is not None else None)
        if not grid_event_id:
            logger.error(f"Unable to determine grid_event_id from event: {grid_event}")
            raise ValueError("Unable to determine grid_event_id from event")

        re = RawEvent(
            grid_event_id=grid_event_id,
            source=source,
            match_id=grid_event.get("match_id"),
            payload=grid_event,
            ingested_by=settings.INGESTOR_NAME
        )
        db.add(re)
        db.commit()
        db.refresh(re)
        return re
    except IntegrityError:
        db.rollback()
        # already exists -> fetch and return existing
        try:
            grid_event_id = grid_event.get("grid_event_id") or grid_event.get("id")
            existing = db.query(RawEvent).filter(
                RawEvent.grid_event_id == grid_event_id
            ).first()
            return existing
        except Exception as e:
            logger.error(f"Error fetching existing raw event: {e}", exc_info=True)
            raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error persisting raw event: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error persisting raw event: {e}", exc_info=True)
        raise
    finally:
        db.close()

@retry(wait=wait_exponential(multiplier=1, min=1, max=30), stop=stop_after_attempt(5))
async def _xadd_with_retry(r: aioredis.Redis, stream: str, data: dict):
    return await r.xadd(stream, data)

async def publish_canonical(event: dict):
    """
    Publish canonical event JSON to Redis Stream `settings.CANONICAL_STREAM`.
    """
    try:
        if not event:
            raise ValueError("event cannot be empty")

        r = await redis()
        # store as single 'data' field
        try:
            event_json = json.dumps(event)
        except Exception as e:
            logger.error(f"Error serializing event to JSON: {e}", exc_info=True)
            raise ValueError(f"Failed to serialize event: {str(e)}")

        try:
            await _xadd_with_retry(r, settings.CANONICAL_STREAM, {"data": event_json})
        except Exception as e:
            logger.error(f"Error publishing canonical event to Redis: {e}", exc_info=True)
            raise
    except Exception as e:
        logger.error(f"Error in publish_canonical: {e}", exc_info=True)
        raise

    # also persist a small index record (optional; non-blocking for speed)
    db = SessionLocal()
    try:
        if not event.get("event_id"):
            logger.warning("Event missing event_id, skipping index persistence")
            return

        idx = CanonicalEventIndex(
            event_id=event["event_id"],
            match_id=event.get("match_id"),
            event_type=event.get("event_type"),
            payload=event,
            enriched=bool(event.get("enriched"))
        )
        db.add(idx)
        db.commit()
    except IntegrityError:
        db.rollback()
        # Index entry already exists, that's okay
        logger.debug("Canonical event index entry already exists")
    except SQLAlchemyError as e:
        db.rollback()
        logger.warning(f"Database error persisting canonical event index: {e}", exc_info=True)
        # Don't fail the publish if index fails
    except Exception as e:
        db.rollback()
        logger.warning(f"Unexpected error persisting canonical event index: {e}", exc_info=True)
        # Don't fail the publish if index fails
    finally:
        db.close()


