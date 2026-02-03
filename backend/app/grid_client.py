# app/grid_client.py
import asyncio
import json
import logging
import math
import random
from typing import Optional
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from app.settings import settings
from app.grid_normalizer import normalize_grid_event
from app.grid_storage import persist_raw_event, publish_canonical
import httpx
import websockets

logger = logging.getLogger("grid_client")


@retry(wait=wait_exponential(multiplier=1, min=4, max=60), stop=stop_after_attempt(10))
async def connect_ws(match_filter: Optional[str] = None):
    """
    Connect to GRID WebSocket stream and consume events indefinitely.
    Assumes GRID accepts API key in headers.
    Retries on failures via tenacity decorator.
    """
    try:
        headers = {"Authorization": f"Bearer {settings.GRID_API_KEY}"}
        if not settings.GRID_WS_URL:
            raise ValueError("GRID_WS_URL is not configured")
        if not settings.GRID_API_KEY:
            raise ValueError("GRID_API_KEY is not configured")
    except Exception as e:
        logger.error(f"[WS] Configuration error: {e}", exc_info=True)
        raise

    try:
        async with websockets.connect(
            settings.GRID_WS_URL,
            extra_headers=headers,
            ping_interval=settings.WS_PING_INTERVAL,
            ping_timeout=settings.WS_PING_TIMEOUT,
            max_size=settings.WS_MAX_SIZE,
        ) as ws:
            logger.info("[WS] Connected to GRID websocket")
            async for raw_text in ws:
                try:
                    if isinstance(raw_text, (bytes, bytearray)):
                        # Drop binary frames (unexpected) to avoid JSON decode issues
                        logger.warning("[WS] Received unexpected binary frame; skipping")
                        continue
                    if settings.MAX_EVENT_BYTES and len(raw_text) > settings.MAX_EVENT_BYTES:
                        logger.warning(f"[WS] Dropping oversized message of {len(raw_text)} bytes")
                        continue
                    raw = json.loads(raw_text)
                except json.JSONDecodeError as e:
                    logger.error(f"[WS] Invalid JSON payload: {e}")
                    continue
                except Exception as e:
                    logger.error(f"[WS] Error parsing JSON payload: {e}", exc_info=True)
                    continue

                # optional: filter by match_id
                if match_filter and raw.get("match_id") != match_filter:
                    continue

                # persist raw (idempotent)
                try:
                    persist_raw_event(raw)
                except Exception as e:
                    logger.error(f"[WS] Error persisting raw event: {e}", exc_info=True)
                    # Continue processing even if persist fails

                # normalize, enrich, and publish canonical
                try:
                    canonical = await normalize_grid_event(raw)
                    await publish_canonical(canonical.dict())
                except Exception as e:
                    evt_ctx = {
                        "match_id": raw.get("match_id"),
                        "type": raw.get("type") or raw.get("event_type"),
                        "seq": raw.get("seq"),
                    }
                    logger.error(f"[WS] Error normalizing/publishing event ctx={evt_ctx}: {e}", exc_info=True)
                    # Continue processing other events
    except asyncio.CancelledError:
        logger.info("[WS] Consumer task cancelled; shutting down gracefully")
        raise
    except websockets.exceptions.ConnectionClosedOK as e:
        logger.info(f"[WS] Connection closed cleanly: {e}")
        # Let tenacity retry
        raise RuntimeError("ws connection closed cleanly")
    except websockets.exceptions.ConnectionClosed as e:
        logger.warning(f"[WS] Connection closed unexpectedly: {e}")
        raise RuntimeError("ws connection ended unexpectedly")
    except websockets.exceptions.InvalidStatusCode as e:
        logger.error(f"[WS] Invalid status code: {e}", exc_info=True)
        raise
    except Exception as e:
        logger.error(f"[WS] Unexpected websocket error: {e}", exc_info=True)
        raise RuntimeError(f"ws connection error: {str(e)}")


async def rest_backfill(matches: list[str], max_parallel: int = 5):
    """
    Poll GRID REST endpoints for missing/late events with parallel processing.
    Includes retries and rate-limit handling.
    """
    if not matches:
        logger.warning("[REST] rest_backfill called with empty matches list")
        return

    if not settings.GRID_REST_BASE:
        logger.error("[REST] GRID_REST_BASE is not configured")
        raise ValueError("GRID_REST_BASE is not configured")

    if not settings.GRID_API_KEY:
        logger.error("[REST] GRID_API_KEY is not configured")
        raise ValueError("GRID_API_KEY is not configured")

    semaphore = asyncio.Semaphore(max_parallel)

    async def backoff_sleep(attempt: int, retry_after: Optional[float] = None):
        if retry_after and retry_after > 0:
            await asyncio.sleep(retry_after)
            return
        # jittered exponential backoff
        base = settings.HTTP_BACKOFF_BASE
        delay = min(60.0, (base ** attempt) + random.random())
        await asyncio.sleep(delay)

    async def fetch_and_process_match(client: httpx.AsyncClient, match_id: str):
        if not match_id:
            return

        async with semaphore:
            url = f"/matches/{match_id}/events"
            headers = {"Authorization": f"Bearer {settings.GRID_API_KEY}"}

            attempt = 0
            while True:
                try:
                    resp = await client.get(url, headers=headers)
                    # Handle rate limit explicitly
                    if resp.status_code == 429:
                        attempt += 1
                        retry_after = None
                        try:
                            retry_after = float(resp.headers.get("Retry-After", "0"))
                        except Exception:
                            retry_after = None
                        logger.warning(f"[REST] 429 for match {match_id}; backing off (attempt {attempt})")
                        if attempt >= settings.HTTP_MAX_RETRIES:
                            logger.error(f"[REST] Max retries reached for match {match_id} (429)")
                            return
                        await backoff_sleep(attempt, retry_after)
                        continue

                    resp.raise_for_status()

                    try:
                        events = resp.json()
                    except Exception as e:
                        logger.error(f"[REST] JSON parse error for match {match_id}: {e}", exc_info=True)
                        return

                    if not isinstance(events, list):
                        logger.warning(f"[REST] Expected list of events for match {match_id}, got {type(events)}")
                        return

                    # Process events in sub-batches to avoid blocking too long
                    for i in range(0, len(events), 50):
                        batch = events[i:i + 50]
                        tasks = [process_single_event(raw, match_id) for raw in batch]
                        await asyncio.gather(*tasks, return_exceptions=True)

                    logger.info(f"[REST] Successfully backfilled {len(events)} events for match {match_id}")
                    return
                except httpx.TimeoutException as e:
                    attempt += 1
                    logger.warning(f"[REST] Timeout for match {match_id} (attempt {attempt}): {e}")
                    if attempt >= settings.HTTP_MAX_RETRIES:
                        logger.error(f"[REST] Max retries reached for match {match_id} (timeout)")
                        return
                    await backoff_sleep(attempt)
                except httpx.HTTPStatusError as e:
                    # Non-429 HTTP errors after raise_for_status
                    attempt += 1
                    status = e.response.status_code if e.response else 'unknown'
                    logger.error(f"[REST] HTTP {status} for match {match_id} (attempt {attempt}): {e}")
                    if attempt >= settings.HTTP_MAX_RETRIES or (400 <= (status or 0) < 500):
                        # Do not retry 4xx except 429 handled above
                        return
                    await backoff_sleep(attempt)
                except httpx.RequestError as e:
                    attempt += 1
                    logger.error(f"[REST] Network error for match {match_id} (attempt {attempt}): {e}")
                    if attempt >= settings.HTTP_MAX_RETRIES:
                        return
                    await backoff_sleep(attempt)
                except Exception as e:
                    logger.error(f"[REST] Error processing match {match_id}: {e}", exc_info=True)
                    return

    async def process_single_event(raw: dict, match_id: str):
        try:
            persist_raw_event(raw)
            canonical = await normalize_grid_event(raw)
            await publish_canonical(canonical.dict())
        except Exception as e:
            logger.error(f"[REST] Error in single event processing for match {match_id}: {e}")

    timeout = httpx.Timeout(settings.HTTP_TIMEOUT)
    async with httpx.AsyncClient(base_url=settings.GRID_REST_BASE, timeout=timeout) as client:
        tasks = [fetch_and_process_match(client, m) for m in matches]
        await asyncio.gather(*tasks)


