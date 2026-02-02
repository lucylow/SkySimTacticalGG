"""
ML-based momentum detection agent.
Uses trained model to detect momentum shifts in real-time.
"""
import numpy as np
from typing import Dict, Optional, Any
import joblib
import os
from pathlib import Path

# Try to load model, fallback to rule-based if not available
MODEL_PATH = Path(__file__).parent.parent.parent / "models" / "momentum.pkl"
model = None

try:
    if MODEL_PATH.exists():
        model = joblib.load(MODEL_PATH)
except Exception:
    pass


class MomentumAgent:
    """ML agent for detecting momentum shifts."""
    
    def __init__(self):
        self.model = model
    
    def infer(self, features: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Infer momentum shift from features.
        Returns signal dict if momentum detected, None otherwise.
        """
        if self.model:
            return self._ml_infer(features)
        else:
            return self._rule_based_infer(features)
    
    def _ml_infer(self, features: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """ML-based inference."""
        try:
            # Extract feature vector
            X = np.array([[
                features.get("kills", 0),
                features.get("econ_delta", 0),
                features.get("round_win_streak", 0),
                features.get("avg_kills_last_5", 0)
            ]])
            
            # Predict probability
            prob = self.model.predict_proba(X)[0][1] if hasattr(self.model, "predict_proba") else 0.5
            
            if prob > 0.7:
                return {
                    "type": "MOMENTUM_SHIFT",
                    "confidence": float(prob),
                    "explanation": {
                        "description": "Sustained kill advantage with economic lead",
                        "kills": features.get("kills", 0),
                        "econ_delta": features.get("econ_delta", 0),
                        "win_streak": features.get("round_win_streak", 0)
                    },
                    "entities": [features.get("team", "unknown")]
                }
        except Exception as e:
            print(f"ML inference error: {e}")
            return self._rule_based_infer(features)
        
        return None
    
    def _rule_based_infer(self, features: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Fallback rule-based inference."""
        win_streak = features.get("round_win_streak", 0)
        econ_delta = features.get("econ_delta", 0)
        avg_kills = features.get("avg_kills_last_5", 0)
        
        # Rule: 3+ win streak AND positive econ AND good kill rate
        if win_streak >= 3 and econ_delta > 3000 and avg_kills > 3:
            confidence = min(0.9, 0.6 + (win_streak - 3) * 0.1)
            return {
                "type": "MOMENTUM_SHIFT",
                "confidence": confidence,
                "explanation": {
                    "description": f"{win_streak}-round win streak with economic advantage",
                    "rounds_won": win_streak,
                    "eco_wins": 0,
                    "key_player": None
                },
                "entities": [features.get("team", "unknown")]
            }
        
        return None


# Global instance
momentum_agent = MomentumAgent()


