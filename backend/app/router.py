# app/router.py
from app.agents.registry import load_config
from app.utils.redis_client import get_redis, incr_capacity, decr_capacity
from typing import List, Dict, Any, Tuple
from pathlib import Path
import yaml

class Router:
    """
    Selects agents to run given a desired capability set.
    Uses static config priorities + runtime counters stored in Redis.
    Now returns agent_name and assigned queue for Celery apply_async(..., queue=queue).
    """

    def __init__(self, config_path: str = None, redis_prefix: str = "agents:runcount:"):
        if config_path is None:
            # Try to find config relative to backend directory
            import os
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            config_path = os.path.join(base_dir, "config", "agents.yaml")
        self.config_path = config_path
        self._load_config()
        self.redis = get_redis()
        self.redis_prefix = redis_prefix

    def _load_config(self):
        p = Path(self.config_path)
        if not p.exists():
            self.config = {}
            return
        with p.open() as f:
            cfg = yaml.safe_load(f)
        self.config = cfg.get("agents", {})

    def _key(self, agent_name: str) -> str:
        return f"{self.redis_prefix}{agent_name}"

    def current_load(self, agent_name: str) -> int:
        v = self.redis.get(self._key(agent_name))
        return int(v) if v else 0

    def capacity_ok(self, agent_name: str) -> bool:
        cfg = self.config.get(agent_name, {})
        maxc = cfg.get("max_concurrency", 1)
        return self.current_load(agent_name) < maxc

    def reserve_slot(self, agent_name: str, ex: int = 60) -> bool:
        key = self._key(agent_name)
        val = incr_capacity(key, 1, ex=ex)
        cfg = self.config.get(agent_name, {})
        if val > cfg.get("max_concurrency", 1):
            decr_capacity(key, 1)
            return False
        return True

    def release_slot(self, agent_name: str) -> int:
        return decr_capacity(self._key(agent_name), 1)

    def choose_agents_for_capability(self, capabilities: List[str]) -> List[Tuple[str, Dict[str, Any]]]:
        """
        Return ordered (agent_name, cfg) tuples that match ANY of the capabilities.
        Sorted by priority desc, then by current load asc.
        """
        matches = []
        for name, cfg in self.config.items():
            caps = cfg.get("capabilities", [])
            if any(c in caps for c in capabilities):
                matches.append((name, cfg))
        matches.sort(key=lambda x: (-x[1].get("priority", 0), self.current_load(x[0])))
        return matches

    def pick_agent(self, capabilities: List[str]) -> Tuple[str, str]:
        """
        Return (agent_name, queue_name) or (None, None) if no agent found/present.
        Prefer agents under capacity; reserve a slot when chosen.
        """
        candidates = self.choose_agents_for_capability(capabilities)
        for name, cfg in candidates:
            if self.capacity_ok(name):
                if self.reserve_slot(name):
                    queue = cfg.get("queue", "general")
                    return name, queue
        # fallback: return best candidate even if over capacity (no slot reserved)
        if candidates:
            best_name, best_cfg = candidates[0]
            return best_name, best_cfg.get("queue", "general")
        return None, None

