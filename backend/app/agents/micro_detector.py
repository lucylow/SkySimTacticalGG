# app/agents/micro_detector.py
from app.agents.base import AgentBase
from app.agents.registry import register_agent

@register_agent
class MicroDetector(AgentBase):
    name = "micro_detector"
    capabilities = ["perception", "heuristics"]
    priority = 10
    default_timeout_s = 10

    def run(self, payload):
        # payload expected: {"grid_snapshot": {...}}
        grid = payload.get("grid_snapshot", {})
        # simple rule-based detector
        characters = []
        for p in grid.get("players", []):
            peek_events = p.get("peek_events", [])
            severity = 0.0
            if len(peek_events) >= 3:
                import statistics
                if statistics.pstdev([e["time"] for e in peek_events]) < 1.0:
                    severity = 0.8
            characters.append({
                "id": p.get("id"),
                "inference": "predictable" if severity>0.5 else "ok",
                "severity": severity,
                "movement_style": "aggressive" if p.get("role")=="entry" else "default"
            })
        return {"characters": characters}
