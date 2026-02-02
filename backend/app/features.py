# app/features.py
import time
from collections import deque, defaultdict
from typing import Dict, Any, List
import math
import numpy as np

# Alias for backward compatibility
def compute_features_from_event(event: Dict[str, Any], feature_manager: FeatureWindowManager, match_id: str, player_id: str) -> Dict[str, Any]:
    """Helper function to compute features from a single event."""
    feature_manager.push_event(match_id, player_id, event)
    return feature_manager.compute_features(match_id, player_id)

# Manage per match/player windows of recent events for fast heuristics & feature computation.

class FeatureWindowManager:
    def __init__(self, window_seconds: float = 4.0):
        self.window_seconds = window_seconds
        # structure: state[match_id][player_id] = deque of events (timestamp, event)
        self.state = defaultdict(lambda: defaultdict(deque))

    def push_event(self, match_id: str, player_id: str, event: Dict[str, Any]):
        ts = event.get("payload", {}).get("ts") or time.time()
        dq = self.state[match_id][player_id]
        dq.append({"ts": float(ts), "evt": event})
        # trim
        cutoff = float(ts) - self.window_seconds
        while dq and dq[0]["ts"] < cutoff:
            dq.popleft()

    def _last_events(self, match_id, player_id):
        return list(self.state[match_id][player_id])

    def compute_features(self, match_id: str, player_id: str) -> Dict[str, Any]:
        evts = self._last_events(match_id, player_id)
        features = {}
        # basic counters
        features["n_events"] = len(evts)
        # last known position & speed estimation
        last_pos = None
        prev_pos = None
        last_ts = None
        speeds = []
        for item in evts:
            e = item["evt"]
            p = e.get("payload", {})
            if p.get("pos"):
                if last_pos is None:
                    last_pos = p["pos"]
                    last_ts = item["ts"]
                else:
                    prev_pos = last_pos
                    prev_ts = last_ts
                    last_pos = p["pos"]
                    last_ts = item["ts"]
                    dt = last_ts - prev_ts
                    if dt > 0:
                        dist = math.sqrt(sum((a-b)**2 for a,b in zip(last_pos, prev_pos)))
                        speeds.append(dist/dt)
        features["speed_mean"] = float(sum(speeds)/len(speeds)) if speeds else 0.0
        features["speed_max"] = float(max(speeds)) if speeds else 0.0

        # orientation: near objective?
        # compute proximity to objective if present in payloads
        dists = []
        for item in evts:
            p = item["evt"].get("payload", {})
            if p.get("pos") and p.get("objective_pos"):
                pos = p["pos"]
                obj = p["objective_pos"]
                d = math.sqrt(sum((a-b)**2 for a,b in zip(pos, obj)))
                dists.append(d)
        features["dist_to_objective_min"] = float(min(dists)) if dists else None

        # combat signals
        kills = sum(1 for item in evts if item["evt"].get("event_type") == "KILL" and item["evt"].get("actor") == player_id)
        deaths = sum(1 for item in evts if item["evt"].get("event_type") == "DEATH" and item["evt"].get("target") == player_id)
        features["kills_last_window"] = kills
        features["deaths_last_window"] = deaths

        # utility usage
        n_ability = sum(1 for item in evts if item["evt"].get("event_type") in ("ABILITY_USE","ABILITY_CAST"))
        features["abilities_used"] = n_ability

        # is player in sight of many enemies? approximate via proximity events
        proximity_count = 0
        for item in evts:
            p = item["evt"].get("payload", {})
            if p.get("nearby_enemies_count"):
                proximity_count = max(proximity_count, int(p.get("nearby_enemies_count")))
        features["nearby_enemies_max"] = proximity_count

        # derived heuristics
        # is player likely entering site? low dist and moving forward
        features["approach_velocity"] = self._estimate_approach_velocity(evts)
        return features

    def _estimate_approach_velocity(self, evts):
        # simple: if speed is positive & dist_to_objective decreasing
        dists = []
        ts = []
        for item in evts:
            p = item["evt"].get("payload", {})
            if p.get("pos") and p.get("objective_pos") and item["ts"]:
                d = math.sqrt(sum((a-b)**2 for a,b in zip(p["pos"], p["objective_pos"])))
                dists.append(d)
                ts.append(item["ts"])
        if len(dists) >= 2:
            # compute linear regression slope (negative slope => approaching)
            slope = np.polyfit(ts, dists, 1)[0]
            return -slope  # positive means approaching
        return 0.0

    def evaluate_heuristics(self, match_id, player_id, features) -> List[Dict[str, Any]]:
        """
        Fast rule-based intent detectors. Return list of candidate intents with heuristic score.
        Examples: 'advance', 'retreat', 'hold', 'peek', 'plant', 'defuse', 'rotate', 'trade'
        """
        candidates = []
        # Heuristic: approach + low dist_to_objective -> 'advance'
        if features.get("dist_to_objective_min") is not None and features.get("approach_velocity", 0) > 0.02:
            candidates.append({"intent": "advance", "score": 0.8, "reason": "approach + velocity"})
        # Heuristic: multiple ability uses near objective & low speed -> 'plant' or 'defuse' depending on context
        if features.get("abilities_used", 0) >= 2 and features.get("dist_to_objective_min", 999) < 3.0:
            candidates.append({"intent": "plant", "score": 0.7, "reason": "utility + close to site"})
        # Heuristic: speed spike + kills -> 'engage'
        if features.get("speed_max",0) > 3.0 and features.get("kills_last_window",0) >= 1:
            candidates.append({"intent": "engage", "score": 0.75, "reason": "speed + recent kill"})
        # Heuristic: nearby_enemies_max high and low speed -> 'hold'
        if features.get("nearby_enemies_max",0) >= 2 and features.get("speed_mean",0) < 0.5:
            candidates.append({"intent": "hold", "score": 0.7, "reason": "contact + low speed"})
        # fallback: no strong heuristic
        return candidates

