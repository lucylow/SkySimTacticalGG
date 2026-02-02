# app/ws_broadcast.py
import asyncio
import json
from typing import Set
from fastapi import WebSocket
from app.utils.message_bus import MessageBus
import threading
import logging

logger = logging.getLogger(__name__)

# Global broadcaster instance used by FastAPI WS handlers.
message_bus = MessageBus()

class WSBroadcaster:
    def __init__(self):
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._message_queue = asyncio.Queue()
        self._loop = None
        # subscribe to Redis pubsub; callback will schedule sending on event loop
        try:
            message_bus.subscribe(self._on_message)
        except Exception as e:
            logger.error(f"Failed to subscribe to message bus: {e}", exc_info=True)
        # Start background task to process messages
        self._processor_task = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop):
        """Set the event loop (called from FastAPI startup)"""
        try:
            self._loop = loop
            self._processor_task = loop.create_task(self._process_messages())
        except Exception as e:
            logger.error(f"Failed to set event loop: {e}", exc_info=True)
            raise

    async def _process_messages(self):
        """Background task to process messages from queue"""
        while True:
            try:
                payload = await self._message_queue.get()
                await self._broadcast(payload)
            except asyncio.CancelledError:
                logger.info("Message processor task cancelled")
                break
            except Exception as e:
                logger.error(f"Error processing message from queue: {e}", exc_info=True)
                # Continue processing other messages

    async def connect(self, ws: WebSocket):
        try:
            await ws.accept()
            async with self._lock:
                self._clients.add(ws)
        except Exception as e:
            logger.error(f"Error accepting WebSocket connection: {e}", exc_info=True)
            raise

    async def disconnect(self, ws: WebSocket):
        try:
            async with self._lock:
                if ws in self._clients:
                    self._clients.remove(ws)
        except Exception as e:
            logger.error(f"Error disconnecting WebSocket: {e}", exc_info=True)

    def _on_message(self, payload: dict):
        # Called in a background thread by MessageBus. Queue message for async processing.
        try:
            if self._loop and self._loop.is_running():
                self._loop.call_soon_threadsafe(self._message_queue.put_nowait, payload)
            else:
                logger.warning("Event loop not available, dropping message")
        except Exception as e:
            logger.error(f"Error queuing message: {e}", exc_info=True)

    async def _broadcast(self, payload: dict):
        try:
            text = json.dumps(payload)
        except Exception as e:
            logger.error(f"Error serializing payload for broadcast: {e}", exc_info=True)
            return
        
        async with self._lock:
            remove = []
            for ws in list(self._clients):
                try:
                    await ws.send_text(text)
                except Exception as e:
                    logger.debug(f"Error sending message to client: {e}")
                    remove.append(ws)
            for ws in remove:
                self._clients.discard(ws)
                logger.debug(f"Removed disconnected client from broadcast list")

broadcaster = WSBroadcaster()

