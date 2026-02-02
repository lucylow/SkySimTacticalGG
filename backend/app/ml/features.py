"""
ML Feature Extraction Pipeline
Converts canonical events into structured feature vectors for training and inference.
"""
from typing import Dict, List, Any
from collections import defaultdict
import pandas as pd
import numpy as np
from datetime import datetime


class FeatureExtractor:
    """Extracts features from event streams for ML models."""
    
    def __init__(self, window_size: int = 5):
        self.window_size = window_size
        self.match_state = defaultdict(lambda: {
            "kills": 0,
            "deaths": 0,
            "rounds_won": 0,
            "economy": 0,
            "round_history": []
        })
    
    def extract_team_features(self, events: List[Dict], team: str, round_num: int) -> Dict[str, Any]:
        """
        Extract team-level features for a given round.
        Uses sliding window of last N rounds.
        """
        team_events = [e for e in events if e.get("team") == team]
        round_events = [e for e in team_events if e.get("round") == round_num]
        
        # Window: last N rounds
        window_start = max(1, round_num - self.window_size + 1)
        window_events = [
            e for e in team_events 
            if window_start <= e.get("round", 0) <= round_num
        ]
        
        features = {
            "round": round_num,
            "team": team,
            "avg_kills_last_5": self._avg_kills(window_events),
            "eco_win_rate": self._eco_win_rate(window_events),
            "round_win_streak": self._win_streak(window_events, round_num),
            "econ_delta": self._econ_delta(window_events),
            "trade_efficiency": self._trade_efficiency(window_events),
            "objective_success_rate": self._objective_success_rate(window_events),
        }
        
        return features
    
    def extract_player_features(self, events: List[Dict], player_id: str, round_num: int) -> Dict[str, Any]:
        """Extract player-level features."""
        player_events = [e for e in events if e.get("actor") == player_id]
        round_events = [e for e in player_events if e.get("round") == round_num]
        
        window_start = max(1, round_num - self.window_size + 1)
        window_events = [
            e for e in player_events 
            if window_start <= e.get("round", 0) <= round_num
        ]
        
        kills = len([e for e in window_events if e.get("event_type") == "KILL"])
        deaths = len([e for e in window_events if "death" in str(e.get("event_type", "")).lower()])
        
        features = {
            "round": round_num,
            "player_id": player_id,
            "kills_per_round": kills / max(1, len(set(e.get("round", 0) for e in window_events))),
            "opening_duel_success": self._opening_duel_success(window_events),
            "time_alive_avg": self._time_alive_avg(window_events),
            "utility_usage": self._utility_usage(window_events),
        }
        
        return features
    
    def _avg_kills(self, events: List[Dict]) -> float:
        """Average kills per round in window."""
        rounds = set(e.get("round", 0) for e in events)
        if not rounds:
            return 0.0
        kills = len([e for e in events if e.get("event_type") == "KILL"])
        return kills / len(rounds)
    
    def _eco_win_rate(self, events: List[Dict]) -> float:
        """Economy round win rate."""
        eco_rounds = [e for e in events if e.get("payload", {}).get("economy", 0) < 2000]
        if not eco_rounds:
            return 0.0
        wins = len([e for e in eco_rounds if e.get("payload", {}).get("won", False)])
        return wins / len(eco_rounds)
    
    def _win_streak(self, events: List[Dict], current_round: int) -> int:
        """Current win streak."""
        streak = 0
        for r in range(current_round, max(0, current_round - 10), -1):
            round_events = [e for e in events if e.get("round") == r]
            if any(e.get("payload", {}).get("won", False) for e in round_events):
                streak += 1
            else:
                break
        return streak
    
    def _econ_delta(self, events: List[Dict]) -> float:
        """Economy delta (spending vs earning)."""
        if len(events) < 2:
            return 0.0
        first_econ = events[0].get("payload", {}).get("economy", 0)
        last_econ = events[-1].get("payload", {}).get("economy", 0)
        return last_econ - first_econ
    
    def _trade_efficiency(self, events: List[Dict]) -> float:
        """Trade kill efficiency."""
        kills = [e for e in events if e.get("event_type") == "KILL"]
        trades = [e for e in kills if e.get("payload", {}).get("trade", False)]
        if not kills:
            return 0.0
        return len(trades) / len(kills)
    
    def _objective_success_rate(self, events: List[Dict]) -> float:
        """Objective (plant/defuse) success rate."""
        objectives = [e for e in events if e.get("event_type") == "OBJECTIVE"]
        if not objectives:
            return 0.0
        successful = len([e for e in objectives if e.get("payload", {}).get("success", False)])
        return successful / len(objectives)
    
    def _opening_duel_success(self, events: List[Dict]) -> float:
        """Opening duel win rate."""
        opening_kills = [
            e for e in events 
            if e.get("event_type") == "KILL" and e.get("payload", {}).get("opening_kill", False)
        ]
        if not opening_kills:
            return 0.0
        return 1.0  # Simplified - would check if player won
    
    def _time_alive_avg(self, events: List[Dict]) -> float:
        """Average time alive per round."""
        # Simplified - would track actual time alive
        return 90.0  # Placeholder
    
    def _utility_usage(self, events: List[Dict]) -> int:
        """Utility usage count."""
        return len([e for e in events if "utility" in str(e.get("event_type", "")).lower()])


class OnlineFeatureExtractor:
    """Real-time feature extraction for streaming events."""
    
    def __init__(self):
        self.rolling_state = defaultdict(lambda: {
            "kills": 0,
            "rounds": [],
            "economy": 0,
            "last_round": 0
        })
    
    def update(self, event: Dict):
        """Update rolling state with new event."""
        team = event.get("team")
        if not team:
            return
        
        state = self.rolling_state[team]
        
        if event.get("event_type") == "KILL":
            state["kills"] += 1
        
        round_num = event.get("round", 0)
        if round_num != state["last_round"]:
            state["rounds"].append({
                "round": round_num,
                "kills": 0,
                "won": False
            })
            state["last_round"] = round_num
        
        if event.get("payload", {}).get("economy"):
            state["economy"] = event["payload"]["economy"]
    
    def snapshot(self, team: str) -> Dict[str, Any]:
        """Get current feature snapshot for team."""
        state = self.rolling_state[team]
        recent_rounds = state["rounds"][-5:] if len(state["rounds"]) >= 5 else state["rounds"]
        
        return {
            "kills": state["kills"],
            "round_win_streak": self._count_win_streak(recent_rounds),
            "econ_delta": state["economy"],
            "avg_kills_last_5": sum(r.get("kills", 0) for r in recent_rounds) / max(1, len(recent_rounds))
        }
    
    def _count_win_streak(self, rounds: List[Dict]) -> int:
        """Count consecutive wins."""
        streak = 0
        for r in reversed(rounds):
            if r.get("won", False):
                streak += 1
            else:
                break
        return streak


