# app/api_opensource.py
"""
API endpoints for open source esports data
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.opensource_esports_client import (
    opensource_esports_client,
    EsportsDataSource,
)
from app.unified_ingest import backfill_matches
import logging

logger = logging.getLogger("api_opensource")

router = APIRouter(prefix="/api/opensource", tags=["opensource"])


@router.get("/live-matches")
async def get_live_matches(
    source: Optional[str] = Query(None, description="Filter by source (riot_games, opendota, etc.)")
):
    """Get live matches from all open source esports APIs"""
    try:
        matches = await opensource_esports_client.fetch_all_live_matches()
        
        if source:
            matches = [m for m in matches if m.get('source') == source]
        
        return {
            "count": len(matches),
            "matches": matches,
        }
    except Exception as e:
        logger.exception(f"Error fetching live matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/riot/live")
async def get_riot_live_matches(region: str = Query("na", description="Region code")):
    """Get live League of Legends matches from Riot API"""
    try:
        matches = await opensource_esports_client.riot.get_live_matches(region)
        return {
            "count": len(matches),
            "matches": matches,
        }
    except Exception as e:
        logger.exception(f"Error fetching Riot live matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/riot/match/{match_id}")
async def get_riot_match(
    match_id: str,
    region: str = Query("americas", description="Region code")
):
    """Get League of Legends match details from Riot API"""
    try:
        match = await opensource_esports_client.riot.get_match_details(match_id, region)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        return match
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching Riot match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opendota/live")
async def get_opendota_live_matches():
    """Get live Dota 2 matches from OpenDota API"""
    try:
        matches = await opensource_esports_client.opendota.get_live_matches()
        return {
            "count": len(matches),
            "matches": matches,
        }
    except Exception as e:
        logger.exception(f"Error fetching OpenDota live matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opendota/match/{match_id}")
async def get_opendota_match(match_id: int):
    """Get Dota 2 match details from OpenDota API"""
    try:
        match = await opensource_esports_client.opendota.get_match_details(match_id)
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        return match
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error fetching OpenDota match: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/opendota/pro-matches")
async def get_opendota_pro_matches(limit: int = Query(100, ge=1, le=1000)):
    """Get recent professional Dota 2 matches from OpenDota API"""
    try:
        matches = await opensource_esports_client.opendota.get_pro_matches(limit)
        return {
            "count": len(matches),
            "matches": matches,
        }
    except Exception as e:
        logger.exception(f"Error fetching OpenDota pro matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backfill")
async def backfill_matches_endpoint(
    match_ids: List[str],
    source: str = Query("grid", description="Source: grid, riot, or opendota")
):
    """Backfill matches from specified source"""
    try:
        await backfill_matches(match_ids, source)
        return {
            "status": "success",
            "message": f"Backfilled {len(match_ids)} matches from {source}",
        }
    except Exception as e:
        logger.exception(f"Error backfilling matches: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sources")
async def get_available_sources():
    """Get list of available open source esports data sources"""
    return {
        "sources": [
            {
                "id": EsportsDataSource.RIOT_GAMES.value,
                "name": "Riot Games API",
                "games": ["league_of_legends", "valorant", "teamfight_tactics"],
                "requires_key": True,
                "rate_limit": "100 requests per 2 minutes (development key)",
            },
            {
                "id": EsportsDataSource.OPENDOTA.value,
                "name": "OpenDota API",
                "games": ["dota2"],
                "requires_key": False,
                "rate_limit": "Unlimited (free tier)",
            },
            {
                "id": EsportsDataSource.LIQUIPEDIA.value,
                "name": "Liquipedia API",
                "games": ["all"],
                "requires_key": False,
                "rate_limit": "MediaWiki API limits",
            },
        ],
    }

