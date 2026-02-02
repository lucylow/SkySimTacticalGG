"""
Motion Generator Agent
Calls HY-Motion 1.0 to generate motion sequences from prompts.
"""
from app.hy_motion_client import HYMotionClient, MotionRequest
from app.settings import settings
from typing import Dict, Any, Optional
import numpy as np

# Initialize HY-Motion client
hy_motion_client = HYMotionClient()

def call_hy_motion(
    prompt: str,
    duration_s: int = 6,
    character_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Call HY-Motion 1.0 model to generate motion sequence.
    
    Args:
        prompt: Natural language prompt describing the motion (< 60 words recommended)
        duration_s: Duration of motion in seconds
        character_id: Optional character identifier
    
    Returns:
        Motion data with frames, SMPL parameters, storage URL, etc.
    """
    try:
        # Use the convenience method for direct prompt generation
        result = hy_motion_client.generate_from_prompt(
            prompt=prompt,
            duration_seconds=duration_s
        )
        
        # Convert artifact_bytes to frames format expected by the system
        artifact_bytes = result.get("artifact_bytes")
        format_type = result.get("format", "npy")
        
        # Parse motion data based on format
        frames = []
        if format_type == "npy":
            # HY-Motion outputs numpy arrays with SMPL parameters
            try:
                motion_data = np.frombuffer(artifact_bytes, dtype=np.float32)
                # Reshape based on expected format (this may need adjustment based on actual HY-Motion output)
                # Typical: [num_frames, num_joints, 3] or [num_frames, smpl_params]
                fps = 30
                n_frames = int(duration_s * fps)
                
                # For now, create frame structure (may need to adjust based on actual HY-Motion output format)
                for i in range(n_frames):
                    frames.append({
                        "frame": i,
                        "smpl_params": motion_data[i * 75:(i + 1) * 75].tolist() if len(motion_data) >= (i + 1) * 75 else None,
                        "timestamp": i / fps
                    })
            except Exception as e:
                print(f"Error parsing motion data: {e}")
                # Fallback: create placeholder frames
                fps = 30
                n_frames = int(duration_s * fps)
                for i in range(n_frames):
                    frames.append({"frame": i, "joints": {"hip": [0.0, 0.0, 0.0]}})
        else:
            # For other formats (gltf, etc.), return raw data
            frames = [{"raw_data": True, "format": format_type}]
        
        return {
            "frames": frames,
            "duration_s": duration_s,
            "fps": 30,
            "format": format_type,
            "predictedActionLabel": prompt[:50],  # Use prompt as label
            "storage_url": None,  # Would be set if uploaded to S3
            "meta": result.get("meta", {})
        }
    except Exception as e:
        print(f"Error calling HY-Motion: {e}")
        # Return error response
        return {
            "error": str(e),
            "frames": [],
            "predictedActionLabel": "error",
            "storage_url": None
        }

from app.agents.base import AgentBase
from app.agents.registry import register_agent
import time, random

@register_agent
class MotionGenerator(AgentBase):
    name = "motion_generator"
    capabilities = ["motion_generation", "smpl"]
    priority = 5
    default_timeout_s = 30

    def run(self, payload):
        # In real use: call your HY-Motion or internal motion model here.
        # This example simulates latency and returns a fake SMPL frame array.
        time.sleep(random.uniform(1.0, 2.5))  # simulate compute time
        frames = []
        duration_s = payload.get("duration_s", 6)
        fps = payload.get("fps", 30)
        n_frames = duration_s * fps
        for i in range(n_frames):
            # fake frame: dict of joint->(x,y,z)
            frames.append({"frame": i, "joints": {"hip": [0.0, 0.0, 0.0]}})
        return {"frames": frames, "meta": {"n_frames": len(frames)}}


