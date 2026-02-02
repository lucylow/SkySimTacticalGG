# app/unified_ingest.py
"""
Unified ingestion service that combines GRID and open source esports data
"""

import asyncio
import logging
from app.grid_client import connect_ws, rest_backfill
from app.opensource_esports_client import poll_open_source_matches, opensource_esports_client
from app.settings import settings

logger = logging.getLogger("unified_ingest")


async def start_unified_ingestion():
    """
    Start unified ingestion from both GRID and open source esports APIs
    """
    tasks = []
    
    # Start GRID WebSocket stream
    logger.info("Starting GRID WebSocket ingestion")
    tasks.append(asyncio.create_task(connect_ws()))
    
    # Start open source esports polling if enabled
    if settings.OPENSOURCE_ENABLED:
        logger.info("Starting open source esports data polling")
        tasks.append(asyncio.create_task(
            poll_open_source_matches(settings.OPENSOURCE_POLL_INTERVAL)
        ))
    else:
        logger.info("Open source esports data polling is disabled")
    
    # Wait for all tasks (they run indefinitely)
    try:
        await asyncio.gather(*tasks)
    except Exception as e:
        logger.exception(f"Error in unified ingestion: {e}")
        raise


async def backfill_matches(match_ids: list[str], source: str = "grid"):
    """
    Backfill matches from either GRID or open source APIs
    
    Args:
        match_ids: List of match IDs to backfill
        source: Source to backfill from ("grid", "riot", "opendota")
    """
    if source == "grid":
        await rest_backfill(match_ids)
    elif source == "riot":
        # Backfill from Riot API
        for match_id in match_ids:
            match_data = await opensource_esports_client.riot.get_match_details(match_id)
            if match_data:
                await opensource_esports_client.normalize_and_publish({
                    'source': 'riot_games',
                    'game': 'league_of_legends',
                    'raw_data': match_data,
                    'match_id': match_id,
                })
    elif source == "opendota":
        # Backfill from OpenDota API
        for match_id in match_ids:
            try:
                match_id_int = int(match_id)
                match_data = await opensource_esports_client.opendota.get_match_details(match_id_int)
                if match_data:
                    await opensource_esports_client.normalize_and_publish({
                        'source': 'opendota',
                        'game': 'dota2',
                        'raw_data': match_data,
                        'match_id': match_id,
                    })
            except ValueError:
                logger.warning(f"Invalid OpenDota match ID: {match_id}")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_unified_ingestion())

