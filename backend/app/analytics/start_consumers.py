# app/analytics/start_consumers.py
"""
Script to start analytics stream consumers.
Run this as a separate process or Celery worker to continuously ingest data.
"""
import asyncio
import logging
from app.analytics.stream_ingest import consume_micro, pg_connect
from app.analytics.canonical_ingest import consume_canonical

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("analytics.consumers")


async def main():
    """Start both stream consumers."""
    logger.info("Starting analytics stream consumers...")
    
    pool = await pg_connect()
    logger.info("Database connection pool created")
    
    try:
        # Run both consumers concurrently
        await asyncio.gather(
            consume_micro(pool),
            consume_canonical(pool)
        )
    except KeyboardInterrupt:
        logger.info("Shutting down consumers...")
    finally:
        await pool.close()
        logger.info("Database connection pool closed")


if __name__ == "__main__":
    asyncio.run(main())


