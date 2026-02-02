# app/opensource_esports_client.py
"""
Open Source Esports Data Client
Integrates multiple open source esports data APIs on top of GRID:
- Riot Games API (League of Legends, Valorant, TFT)
- OpenDota API (Dota 2)
- Liquipedia API (Tournament data, match history)
- Pandascore API (Free tier)
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum
import httpx
from tenacity import retry, wait_exponential, stop_after_attempt
from app.settings import settings
from app.grid_normalizer import normalize_grid_event
from app.grid_storage import persist_raw_event, publish_canonical

logger = logging.getLogger("opensource_esports_client")


class EsportsDataSource(str, Enum):
    """Supported open source esports data sources"""
    RIOT_GAMES = "riot_games"
    OPENDOTA = "opendota"
    LIQUIPEDIA = "liquipedia"
    PANDASCORE = "pandascore"


class RiotGamesClient:
    """Riot Games API client for League of Legends and Valorant"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, 'RIOT_API_KEY', None)
        self.base_urls = {
            'americas': 'https://americas.api.riotgames.com',
            'europe': 'https://europe.api.riotgames.com',
            'asia': 'https://asia.api.riotgames.com',
        }
        self.regional_urls = {
            'na': 'https://na1.api.riotgames.com',
            'euw': 'https://euw1.api.riotgames.com',
            'kr': 'https://kr.api.riotgames.com',
        }
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def get_live_matches(self, region: str = 'na') -> List[Dict[str, Any]]:
        """Get live League of Legends matches"""
        if not self.api_key:
            logger.warning("Riot API key not configured, skipping live matches")
            return []
        
        url = f"{self.regional_urls.get(region, self.regional_urls['na'])}/lol/spectator/v4/featured-games"
        headers = {"X-Riot-Token": self.api_key}
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get('gameList', [])
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    logger.warning("Riot API rate limit hit")
                else:
                    logger.exception(f"Error fetching Riot live matches: {e}")
                return []
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def get_match_details(self, match_id: str, region: str = 'americas') -> Optional[Dict[str, Any]]:
        """Get match details from Riot API"""
        if not self.api_key:
            return None
        
        url = f"{self.base_urls.get(region, self.base_urls['americas'])}/lol/match/v5/matches/{match_id}"
        headers = {"X-Riot-Token": self.api_key}
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return None
                logger.exception(f"Error fetching Riot match details: {e}")
                return None
    
    async def get_valorant_matches(self, region: str = 'na') -> List[Dict[str, Any]]:
        """Get Valorant match data (requires different endpoint)"""
        # Valorant API structure differs - placeholder for implementation
        logger.info("Valorant matches endpoint - to be implemented")
        return []


class OpenDotaClient:
    """OpenDota API client for Dota 2 data"""
    
    def __init__(self):
        self.base_url = "https://api.opendota.com/api"
        # OpenDota is free and doesn't require API key, but you can register for higher rate limits
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def get_live_matches(self) -> List[Dict[str, Any]]:
        """Get live Dota 2 matches"""
        url = f"{self.base_url}/live"
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.json()
            except Exception as e:
                logger.exception(f"Error fetching OpenDota live matches: {e}")
                return []
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def get_match_details(self, match_id: int) -> Optional[Dict[str, Any]]:
        """Get Dota 2 match details"""
        url = f"{self.base_url}/matches/{match_id}"
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                return resp.json()
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    return None
                logger.exception(f"Error fetching OpenDota match details: {e}")
                return None
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def get_pro_matches(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get recent professional Dota 2 matches"""
        url = f"{self.base_url}/proMatches"
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(url)
                resp.raise_for_status()
                matches = resp.json()
                return matches[:limit]
            except Exception as e:
                logger.exception(f"Error fetching OpenDota pro matches: {e}")
                return []


class LiquipediaClient:
    """Liquipedia API client for tournament and match data"""
    
    def __init__(self):
        self.base_url = "https://liquipedia.net/api.php"
        # Liquipedia uses MediaWiki API format
    
    @retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(5))
    async def search_tournaments(self, game: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search for tournaments on Liquipedia"""
        params = {
            "action": "query",
            "format": "json",
            "list": "search",
            "srsearch": f"{game} tournament",
            "srlimit": limit
        }
        
        async with httpx.AsyncClient(timeout=30) as client:
            try:
                resp = await client.get(self.base_url, params=params)
                resp.raise_for_status()
                data = resp.json()
                return data.get('query', {}).get('search', [])
            except Exception as e:
                logger.exception(f"Error searching Liquipedia: {e}")
                return []


class OpenSourceEsportsClient:
    """Unified client for all open source esports data sources"""
    
    def __init__(self):
        self.riot = RiotGamesClient()
        self.opendota = OpenDotaClient()
        self.liquipedia = LiquipediaClient()
    
    async def fetch_all_live_matches(self) -> List[Dict[str, Any]]:
        """Fetch live matches from all available sources"""
        all_matches = []
        
        # Fetch from multiple sources concurrently
        tasks = [
            self._fetch_riot_matches(),
            self._fetch_opendota_matches(),
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_matches.extend(result)
            elif isinstance(result, Exception):
                logger.exception(f"Error fetching matches: {result}")
        
        return all_matches
    
    async def _fetch_riot_matches(self) -> List[Dict[str, Any]]:
        """Fetch Riot Games matches"""
        matches = []
        try:
            live = await self.riot.get_live_matches()
            for match in live:
                matches.append({
                    'source': EsportsDataSource.RIOT_GAMES.value,
                    'game': 'league_of_legends',
                    'raw_data': match,
                    'match_id': str(match.get('gameId', '')),
                })
        except Exception as e:
            logger.exception(f"Error fetching Riot matches: {e}")
        return matches
    
    async def _fetch_opendota_matches(self) -> List[Dict[str, Any]]:
        """Fetch OpenDota matches"""
        matches = []
        try:
            live = await self.opendota.get_live_matches()
            for match in live:
                matches.append({
                    'source': EsportsDataSource.OPENDOTA.value,
                    'game': 'dota2',
                    'raw_data': match,
                    'match_id': str(match.get('match_id', '')),
                })
        except Exception as e:
            logger.exception(f"Error fetching OpenDota matches: {e}")
        return matches
    
    async def normalize_and_publish(self, match_data: Dict[str, Any]):
        """Normalize open source match data and publish to canonical event stream"""
        source = match_data.get('source')
        raw_data = match_data.get('raw_data', {})
        game = match_data.get('game', 'unknown')
        match_id = match_data.get('match_id', '')
        
        # Create a GRID-like event structure for normalization
        grid_like_event = {
            'ingestion_id': f"{source}-{match_id}-{datetime.utcnow().isoformat()}",
            'grid_event_id': f"{source}-{match_id}",
            'received_at': datetime.utcnow().isoformat(),
            'match_id': match_id,
            'game': game,
            'source': source,
            'payload': raw_data,
        }
        
        # Persist raw event
        persist_raw_event(grid_like_event)
        
        # Normalize using existing GRID normalizer
        try:
            canonical = await normalize_grid_event(grid_like_event)
            await publish_canonical(canonical.dict())
            logger.info(f"Published normalized event from {source} for match {match_id}")
        except Exception as e:
            logger.exception(f"Error normalizing event from {source}: {e}")


async def poll_open_source_matches(interval_seconds: int = 60):
    """
    Continuously poll open source esports APIs for live matches
    and integrate them with GRID data stream
    """
    client = OpenSourceEsportsClient()
    
    logger.info("Starting open source esports data polling")
    
    while True:
        try:
            matches = await client.fetch_all_live_matches()
            logger.info(f"Fetched {len(matches)} matches from open source APIs")
            
            for match in matches:
                await client.normalize_and_publish(match)
            
            await asyncio.sleep(interval_seconds)
        except Exception as e:
            logger.exception(f"Error in open source polling loop: {e}")
            await asyncio.sleep(interval_seconds)


# Export singleton instance
opensource_esports_client = OpenSourceEsportsClient()

