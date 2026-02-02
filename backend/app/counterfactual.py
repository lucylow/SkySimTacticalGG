"""
Counterfactual "what-if" replay system.
Allows coaches to simulate alternative decisions.
"""
from typing import Dict, List, Any, Callable, Optional
from copy import deepcopy


class CounterfactualEngine:
    """Simulates alternative outcomes from modified events."""
    
    def fork_events(self, events: List[Dict], fork_index: int, modification_fn: Callable) -> List[Dict]:
        """
        Fork event timeline at given index with modification.
        
        Args:
            events: Original event list
            fork_index: Index to fork at
            modification_fn: Function to modify event: fn(event) -> modified_event
        
        Returns:
            Forked event list
        """
        forked = deepcopy(events)
        
        if 0 <= fork_index < len(forked):
            original = forked[fork_index]
            modified = modification_fn(original)
            forked[fork_index] = modified
        
        return forked
    
    def simulate(self, events: List[Dict]) -> Dict[str, Any]:
        """
        Simulate outcome from event list.
        Returns summary of projected results.
        """
        state = {
            "teamA_score": 0,
            "teamB_score": 0,
            "kills": {"teamA": 0, "teamB": 0},
            "trades": 0,
            "objectives": {"teamA": 0, "teamB": 0}
        }
        
        for event in events:
            event_type = event.get("event_type", "")
            team = event.get("team", "")
            
            if event_type == "KILL":
                if team:
                    state["kills"][team] = state["kills"].get(team, 0) + 1
                
                if event.get("payload", {}).get("trade", False):
                    state["trades"] += 1
            
            elif event_type == "OBJECTIVE":
                if team:
                    state["objectives"][team] = state["objectives"].get(team, 0) + 1
            
            elif event_type == "ROUND_END":
                winner = event.get("payload", {}).get("winner")
                if winner == "teamA":
                    state["teamA_score"] += 1
                elif winner == "teamB":
                    state["teamB_score"] += 1
        
        return {
            "projected_score": {
                "teamA": state["teamA_score"],
                "teamB": state["teamB_score"]
            },
            "total_kills": sum(state["kills"].values()),
            "trades": state["trades"],
            "objectives": state["objectives"],
            "rounds_simulated": len([e for e in events if e.get("event_type") == "ROUND_END"])
        }
    
    def compare(self, original: List[Dict], forked: List[Dict]) -> Dict[str, Any]:
        """
        Compare original vs counterfactual outcomes.
        """
        original_outcome = self.simulate(original)
        forked_outcome = self.simulate(forked)
        
        return {
            "original": original_outcome,
            "counterfactual": forked_outcome,
            "differences": {
                "score_delta": {
                    "teamA": forked_outcome["projected_score"]["teamA"] - original_outcome["projected_score"]["teamA"],
                    "teamB": forked_outcome["projected_score"]["teamB"] - original_outcome["projected_score"]["teamB"]
                },
                "kills_delta": forked_outcome["total_kills"] - original_outcome["total_kills"]
            }
        }


# Global engine instance
counterfactual_engine = CounterfactualEngine()


