# app/opensource_example.py
"""
Example usage of open source esports data integration
"""

import asyncio
import logging
from app.opensource_esports_client import opensource_esports_client
from app.unified_ingest import start_unified_ingestion, backfill_matches

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def example_fetch_live_matches():
    """Example: Fetch live matches from all open source APIs"""
    logger.info("Fetching live matches from all sources...")
    
    matches = await opensource_esports_client.fetch_all_live_matches()
    
    logger.info(f"Found {len(matches)} live matches")
    
    for match in matches:
        logger.info(f"  - {match['source']}: {match['game']} match {match['match_id']}")
    
    return matches


async def example_get_riot_match():
    """Example: Get a specific Riot Games match"""
    # Replace with actual match ID
    match_id = "NA1_1234567890"
    
    logger.info(f"Fetching Riot match {match_id}...")
    
    match = await opensource_esports_client.riot.get_match_details(match_id)
    
    if match:
        logger.info(f"Match found: {match.get('info', {}).get('gameMode', 'Unknown')}")
    else:
        logger.info("Match not found")


async def example_get_opendota_match():
    """Example: Get a specific OpenDota match"""
    # Replace with actual match ID
    match_id = 1234567890
    
    logger.info(f"Fetching OpenDota match {match_id}...")
    
    match = await opensource_esports_client.opendota.get_match_details(match_id)
    
    if match:
        logger.info(f"Match found: {match.get('game_mode', 'Unknown')}")
    else:
        logger.info("Match not found")


async def example_backfill():
    """Example: Backfill matches from different sources"""
    logger.info("Backfilling matches...")
    
    # Backfill from Riot
    riot_match_ids = ["NA1_1234567890", "NA1_0987654321"]
    await backfill_matches(riot_match_ids, source="riot")
    
    # Backfill from OpenDota
    opendota_match_ids = ["1234567890", "0987654321"]
    await backfill_matches(opendota_match_ids, source="opendota")


async def example_unified_ingestion():
    """Example: Start unified ingestion (GRID + open source)"""
    logger.info("Starting unified ingestion...")
    logger.info("This will run indefinitely. Press Ctrl+C to stop.")
    
    try:
        await start_unified_ingestion()
    except KeyboardInterrupt:
        logger.info("Stopped by user")


if __name__ == "__main__":
    # Run examples
    print("Open Source Esports Data Integration Examples")
    print("=" * 50)
    
    # Uncomment the example you want to run:
    
    # Example 1: Fetch live matches
    # asyncio.run(example_fetch_live_matches())
    
    # Example 2: Get specific Riot match
    # asyncio.run(example_get_riot_match())
    
    # Example 3: Get specific OpenDota match
    # asyncio.run(example_get_opendota_match())
    
    # Example 4: Backfill matches
    # asyncio.run(example_backfill())
    
    # Example 5: Start unified ingestion (runs indefinitely)
    # asyncio.run(example_unified_ingestion())
    
    print("\nUncomment an example above to run it!")

