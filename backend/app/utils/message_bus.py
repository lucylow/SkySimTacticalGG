# app/utils/message_bus.py
import threading
import json
from app.utils.redis_client import get_redis

class MessageBus:
    """
    Very small wrapper around Redis pub/sub for progress updates.
    Frontend WebSocket(s) can subscribe to the same channel.
    """
    CHANNEL = "agents:events"

    def publish(self, payload: dict):
        r = get_redis()
        r.publish(self.CHANNEL, json.dumps(payload))

    def subscribe(self, callback):
        r = get_redis()
        pubsub = r.pubsub(ignore_subscribe_messages=True)
        pubsub.subscribe(self.CHANNEL)

        def run():
            for msg in pubsub.listen():
                data = msg["data"]
                try:
                    payload = json.loads(data)
                except Exception:
                    payload = {"raw": data}
                callback(payload)

        t = threading.Thread(target=run, daemon=True)
        t.start()
        return pubsub
