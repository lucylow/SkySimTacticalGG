# app/utils/redis_client.py
import redis
import os
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

_redis = None

def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis

# Helpers
def incr_capacity(key: str, delta: int = 1, ex: Optional[int] = None):
    r = get_redis()
    val = r.incrby(key, delta)
    if ex:
        r.expire(key, ex)
    return int(val)

def decr_capacity(key: str, delta: int = 1):
    r = get_redis()
    return int(r.decrby(key, delta))


