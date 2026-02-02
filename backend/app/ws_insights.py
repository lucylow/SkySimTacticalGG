# app/ws_insights.py
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import aioredis
import json
from app.settings import settings
from typing import Set, Optional
import logging

logger = logging.getLogger("ws_insights")

clients: Set[WebSocket] = set()
redis_client: Optional[aioredis.Redis] = None


async def init_redis():
    """Initialize Redis client."""
    global redis_client
    if redis_client is None:
        try:
            redis_client = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}", exc_info=True)
            raise
    return redis_client


async def insights_ws(ws: WebSocket):
    """WebSocket endpoint for insights streaming."""
    try:
        await ws.accept()
        clients.add(ws)
        logger.info(f"Insights WebSocket client connected. Total clients: {len(clients)}")
    except Exception as e:
        logger.error(f"Error accepting insights WebSocket connection: {e}", exc_info=True)
        try:
            await ws.close(code=1011, reason="Internal server error")
        except Exception:
            pass
        return
    
    try:
        # Send recent insights snapshot (optional)
        # Listen to stream (blocking) and forward entries
        try:
            r = await init_redis()
        except Exception as e:
            logger.error(f"Failed to initialize Redis for insights WebSocket: {e}", exc_info=True)
            try:
                await ws.send_text(json.dumps({"type": "error", "message": "Failed to connect to data stream"}))
            except Exception:
                pass
            return
        
        last_id = "$"  # Start from newest messages
        
        # Send initial connection message
        try:
            await ws.send_text(json.dumps({"type": "connected", "message": "Connected to insights stream"}))
        except Exception as e:
            logger.warning(f"Error sending initial connection message: {e}")
        
        while True:
            try:
                # Read from stream with timeout
                msgs = await r.xread({"events:insights": last_id}, block=2000, count=5)
                
                if msgs:
                    for stream, entries in msgs:
                        for msg_id, data in entries:
                            last_id = msg_id
                            payload = data.get("data")
                            if payload:
                                try:
                                    await ws.send_text(payload)
                                except WebSocketDisconnect:
                                    raise
                                except Exception as e:
                                    logger.warning(f"Error sending insight message: {e}")
                                    raise
                else:
                    # Send keepalive ping
                    try:
                        await ws.send_text(json.dumps({"type": "ping"}))
                    except WebSocketDisconnect:
                        raise
                    except Exception as e:
                        logger.warning(f"Error sending keepalive: {e}")
                    
            except asyncio.TimeoutError:
                # Send keepalive
                try:
                    await ws.send_text(json.dumps({"type": "ping"}))
                except WebSocketDisconnect:
                    raise
                except Exception as e:
                    logger.warning(f"Error sending keepalive after timeout: {e}")
            except WebSocketDisconnect:
                logger.info("Insights WebSocket client disconnected")
                break
            except Exception as e:
                logger.error(f"Error in insights WebSocket loop: {e}", exc_info=True)
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        clients.discard(ws)
        logger.info(f"Insights WebSocket client disconnected. Total clients: {len(clients)}")


async def broadcast_insight(insight_data: dict):
    """Broadcast insight to all connected WebSocket clients."""
    if not clients:
        return
    
    if not insight_data:
        logger.warning("Attempted to broadcast empty insight data")
        return
    
    try:
        payload = json.dumps(insight_data)
    except Exception as e:
        logger.error(f"Error serializing insight data for broadcast: {e}", exc_info=True)
        return
    
    disconnected = []
    
    for client in list(clients):
        try:
            await client.send_text(payload)
        except Exception as e:
            logger.debug(f"Failed to send insight to client: {e}")
            disconnected.append(client)
    
    # Remove disconnected clients
    for client in disconnected:
        clients.discard(client)

