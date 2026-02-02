"""
WebSocket endpoint for live 3D replay viewer.
Broadcasts canonical events to connected clients.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Set
import json
import asyncio
import logging
from app.metrics import WEBSOCKET_CONNECTIONS

logger = logging.getLogger(__name__)

router = APIRouter()
clients: Set[WebSocket] = set()


@router.websocket("/ws/replay")
async def replay_ws(ws: WebSocket):
    """WebSocket endpoint for 3D replay viewer."""
    
    try:
        await ws.accept()
        clients.add(ws)
        WEBSOCKET_CONNECTIONS.labels(endpoint="replay").inc()
        logger.info("Replay WebSocket client connected")
    except Exception as e:
        logger.error(f"Error accepting replay WebSocket connection: {e}", exc_info=True)
        try:
            await ws.close(code=1011, reason="Internal server error")
        except Exception:
            pass
        return
    
    try:
        while True:
            # Keep connection alive, allow client pings
            try:
                await ws.receive_text()
            except WebSocketDisconnect:
                logger.info("Replay WebSocket client disconnected")
                break
            except Exception as e:
                logger.error(f"Error receiving replay WebSocket message: {e}", exc_info=True)
                break
    except WebSocketDisconnect:
        logger.info("Replay WebSocket client disconnected")
    except Exception as e:
        logger.error(f"Unexpected error in replay WebSocket handler: {e}", exc_info=True)
    finally:
        clients.discard(ws)
        WEBSOCKET_CONNECTIONS.labels(endpoint="replay").dec()


async def broadcast_event(event: dict):
    """
    Broadcast a canonical event to all connected replay clients.
    Called from ingestion pipeline.
    """
    if not clients:
        return
    
    if not event:
        logger.warning("Attempted to broadcast empty event")
        return
    
    try:
        message = json.dumps(event)
    except Exception as e:
        logger.error(f"Error serializing event for broadcast: {e}", exc_info=True)
        return
    
    dead_clients = []
    
    for ws in list(clients):
        try:
            await ws.send_text(message)
        except Exception as e:
            logger.debug(f"Error sending event to replay client: {e}")
            dead_clients.append(ws)
    
    # Clean up dead connections
    for ws in dead_clients:
        clients.discard(ws)
        WEBSOCKET_CONNECTIONS.labels(endpoint="replay").dec()


