# app/agents/base.py
from typing import Any, Dict
import time
import logging

logger = logging.getLogger(__name__)

class AgentBase:
    """
    Base class for agents. Implementations should override `run`.
    Recommended to be lightweight and idempotent.
    """
    name: str = "agent_base"
    capabilities = []  # e.g., ["perception"]
    default_timeout_s = 10
    priority = 5

    def __init__(self, config: Dict = None):
        self.config = config or {}

    def run(self, payload: Dict) -> Dict:
        """
        Synchronous run method. Return dict with result and meta fields.
        Can raise exceptions for hard failures.
        """
        raise NotImplementedError()

    # helper wrapper to measure time and standardize output
    def execute(self, payload: Dict) -> Dict:
        t0 = time.time()
        logger.info("Agent %s starting run", self.name)
        result = self.run(payload)
        elapsed = time.time() - t0
        return {
            "agent": self.name,
            "elapsed_s": elapsed,
            "result": result
        }


