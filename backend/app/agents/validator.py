# app/agents/validator.py
from app.agents.base import AgentBase
from app.agents.registry import register_agent

@register_agent
class Validator(AgentBase):
    name = "validator"
    capabilities = ["validation", "scoring"]
    priority = 7
    default_timeout_s = 5

    def run(self, payload):
        # payload contains motion frames or other results to validate
        frames = payload.get("frames", [])
        score = 0.0
        if frames:
            # simple validation: check frame count and structure
            n_frames = len(frames)
            if n_frames > 0:
                score = min(1.0, n_frames / 180.0)  # normalize to 0-1
        return {
            "score": score,
            "valid": score > 0.5,
            "n_frames": len(frames)
        }


