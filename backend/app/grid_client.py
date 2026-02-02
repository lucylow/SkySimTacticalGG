# app/grid_client.py
import asyncio
import json
import logging
from tenacity import retry, wait_exponential, stop_after_attempt
from app.settings import settings
from app.grid_normalizer import normalize_grid_event
from app.grid_storage import persist_raw_event, publish_canonical
import httpx
import websockets

logger = logging.getLogger("grid_client")

@retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(10))
async def connect_ws(match_filter: str = None):
    """
    Connect to GRID WebSocket stream and consume events indefinitely.
    This example assumes GRID accepts API key in headers.
    """
    try:
        headers = {"Authorization": f"Bearer {settings.GRID_API_KEY}"}
        if not settings.GRID_WS_URL:
            raise ValueError("GRID_WS_URL is not configured")
        if not settings.GRID_API_KEY:
            raise ValueError("GRID_API_KEY is not configured")
    except Exception as e:
        logger.error(f"Configuration error: {e}", exc_info=True)
        raise
    
    try:
        async with websockets.connect(settings.GRID_WS_URL, extra_headers=headers) as ws:
            logger.info("connected to GRID websocket")
            async for raw_text in ws:
                try:
                    raw = json.loads(raw_text)
                except json.JSONDecodeError as e:
                    logger.error(f"Invalid JSON payload: {e}", exc_info=True)
                    continue
                except Exception as e:
                    logger.error(f"Error parsing JSON payload: {e}", exc_info=True)
                    continue
                
                # optional: filter by match_id
                if match_filter and raw.get("match_id") != match_filter:
                    continue
                
                # persist raw (idempotent)
                try:
                    persist_raw_event(raw)
                except Exception as e:
                    logger.error(f"Error persisting raw event: {e}", exc_info=True)
                    # Continue processing even if persist fails
                
                # normalize, enrich, and publish canonical
                try:
                    canonical = await normalize_grid_event(raw)
                    await publish_canonical(canonical.dict())
                except Exception as e:
                    logger.error(f"Error normalizing/publishing event: {e}", exc_info=True)
                    # Continue processing other events
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"GRID WebSocket connection closed: {e}")
        raise RuntimeError("ws connection ended unexpectedly")
    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"GRID WebSocket invalid status code: {e}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"GRID WebSocket error: {e}", exc_info=True)
        raise RuntimeError(f"ws connection error: {str(e)}")


async def rest_backfill(matches: list[str]):
    """
    Poll GRID REST endpoints for missing/late events.
    Useful for backfilling or systems that only provide REST.
    """
    if not matches:
        logger.warning("rest_backfill called with empty matches list")
        return
    
    if not settings.GRID_REST_BASE:
        logger.error("GRID_REST_BASE is not configured")
        raise ValueError("GRID_REST_BASE is not configured")
    
    if not settings.GRID_API_KEY:
        logger.error("GRID_API_KEY is not configured")
        raise ValueError("GRID_API_KEY is not configured")
    
    async with httpx.AsyncClient(base_url=settings.GRID_REST_BASE, timeout=30) as client:
        for match_id in matches:
            if not match_id:
                logger.warning("Skipping empty match_id")
                continue
            
            try:
                url = f"/matches/{match_id}/events"
                try:
                    resp = await client.get(url, headers={"Authorization": f"Bearer {settings.GRID_API_KEY}"})
                    resp.raise_for_status()
                except httpx.HTTPStatusError as e:
                    logger.error(f"HTTP error fetching events for match {match_id}: {e.response.status_code} - {e.response.text}", exc_info=True)
                    continue
                except httpx.RequestError as e:
                    logger.error(f"Request error fetching events for match {match_id}: {e}", exc_info=True)
                    continue
                except Exception as e:
                    logger.error(f"Unexpected error fetching events for match {match_id}: {e}", exc_info=True)
                    continue
                
                try:
                    events = resp.json()
                except Exception as e:
                    logger.error(f"Error parsing JSON response for match {match_id}: {e}", exc_info=True)
                    continue
                
                if not isinstance(events, list):
                    logger.warning(f"Expected list of events for match {match_id}, got {type(events)}")
                    continue
                
                for raw in events:
                    try:
                        persist_raw_event(raw)
                    except Exception as e:
                        logger.error(f"Error persisting raw event for match {match_id}: {e}", exc_info=True)
                        continue
                    
                    try:
                        canonical = await normalize_grid_event(raw)
                        await publish_canonical(canonical.dict())
                    except Exception as e:
                        logger.error(f"Error normalizing/publishing event for match {match_id}: {e}", exc_info=True)
                        continue
            except Exception as e:
                logger.error(f"Unexpected error processing match {match_id}: {e}", exc_info=True)
                continue


