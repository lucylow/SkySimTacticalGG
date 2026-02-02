"""
Betting-safe signal gating middleware.
Ensures signals cannot be misused for wagering contexts.
"""
from typing import Dict, Optional
from pydantic import BaseModel
from datetime import datetime
import time


class SignalPolicy(BaseModel):
    """Policy for signal emission."""
    min_delay_seconds: int = 120  # 2 minute delay
    requires_review: bool = True
    allow_live: bool = False
    audience: list = ["ANALYST", "EDUCATIONAL"]


class SignalGate:
    """Gates signals based on policy."""
    
    def __init__(self):
        self.policies = {
            "MOMENTUM_SHIFT": SignalPolicy(min_delay_seconds=120, requires_review=True),
            "STAR_PLAYER": SignalPolicy(min_delay_seconds=60, requires_review=True),
            "ECONOMY_CRASH": SignalPolicy(min_delay_seconds=90, requires_review=True),
            "DEFAULT": SignalPolicy()
        }
    
    def gate(self, signal: Dict, policy: Optional[SignalPolicy] = None) -> Optional[Dict]:
        """
        Gate a signal based on policy.
        Returns gated signal or None if blocked.
        """
        signal_type = signal.get("type", "DEFAULT")
        policy = policy or self.policies.get(signal_type, self.policies["DEFAULT"])
        
        now = time.time()
        signal_time = self._get_signal_time(signal)
        
        # Check delay
        if not policy.allow_live and signal_time and signal_time > now - policy.min_delay_seconds:
            return None  # Too recent, block
        
        # Check review requirement
        if policy.requires_review and signal.get("status") != "APPROVED":
            return None  # Not approved
        
        # Add safety labels
        gated = signal.copy()
        gated["label"] = "ANALYSIS_ONLY"
        gated["audience"] = policy.audience
        gated["gated_at"] = datetime.utcnow().isoformat()
        gated["policy_version"] = "1.0"
        
        return gated
    
    def _get_signal_time(self, signal: Dict) -> Optional[float]:
        """Extract timestamp from signal."""
        timestamp = signal.get("timestamp")
        if isinstance(timestamp, str):
            try:
                return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).timestamp()
            except:
                return None
        elif isinstance(timestamp, (int, float)):
            return timestamp
        return None


# Global gate instance
signal_gate = SignalGate()


