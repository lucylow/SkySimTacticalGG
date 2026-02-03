"""
HY-Motion API Client (Compatibility Wrapper)
This module provides a compatibility wrapper around the main HY-Motion client
for backward compatibility with existing code.

For new code, use app.hy_motion_client directly.
"""
from typing import Dict, Any, Optional
from app.hy_motion_client import HYMotionClient as MainHYMotionClient

class HYMotionClient:
    """
    Compatibility wrapper for HY-Motion 1.0 API.
    Delegates to the main HY-Motion client implementation.
    """
    
    def __init__(self, base_url: Optional[str] = None):
        """
        Initialize client.
        
        Args:
            base_url: Optional API URL (for REST API mode)
        """
        # Initialize main client with API URL if provided
        self._main_client = MainHYMotionClient(
            base_url=base_url if base_url and base_url != "https://api.hymotion.example/generate" else None
        )
        self._base_url = base_url
    
    def generate_motion(
        self,
        prompt: str,
        duration_s: int = 6,
        character_id: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Call HY-Motion 1.0 to generate motion sequence.
        
        Args:
            prompt: Natural language prompt describing the motion (< 60 words recommended)
            duration_s: Duration of motion in seconds
            character_id: Optional character identifier
            **kwargs: Additional parameters (ignored for compatibility)
        
        Returns:
            Dict with motion data including frames, SMPL parameters, etc.
        """
        # Use the convenience method from main client
        try:
            result = self._main_client.generate_from_prompt(
                prompt=prompt,
                duration_seconds=duration_s
            )
            
            # Convert to expected format
            artifact_bytes = result.get("artifact_bytes")
            format_type = result.get("format", "npy")
            
            # For compatibility, return in the expected format
            # If we have artifact bytes, we need to parse them
            # For now, return a structure that matches the expected interface
            fps = 30
            num_frames = duration_s * fps
            
            return {
                "frames": self._parse_motion_frames(artifact_bytes, format_type, num_frames, fps),
                "predictedActionLabel": prompt[:50] if prompt else "unknown",
                "duration_s": duration_s,
                "fps": fps,
                "storage_url": None,  # Would be set if uploaded to S3
                "metadata": {
                    "prompt": prompt,
                    "character_id": character_id,
                    "format": format_type,
                    "model": "HY-Motion-1.0",
                    **result.get("meta", {})
                }
            }
        except Exception as e:
            # Fallback to Sample for development if main client fails
            if self._base_url == "https://api.hymotion.example/generate":
                return self._generate_Sample_motion(prompt, duration_s)
            raise
    
    def _parse_motion_frames(
        self,
        artifact_bytes: Optional[bytes],
        format_type: str,
        num_frames: int,
        fps: int
    ) -> list:
        """
        Parse motion artifact bytes into frame format.
        
        Args:
            artifact_bytes: Raw motion data bytes
            format_type: Format of the data (npy, gltf, etc.)
            num_frames: Expected number of frames
            fps: Frames per second
        
        Returns:
            List of frame dictionaries
        """
        if not artifact_bytes:
            # Return empty frames if no data
            return [{"frame": i, "timestamp": i / fps} for i in range(num_frames)]
        
        if format_type == "npy":
            try:
                import numpy as np
                motion_data = np.frombuffer(artifact_bytes, dtype=np.float32)
                frames = []
                for i in range(num_frames):
                    frame_idx = i * 75  # Assuming 75 SMPL parameters per frame
                    if frame_idx + 75 <= len(motion_data):
                        frames.append({
                            "frame": i,
                            "timestamp": i / fps,
                            "smpl_params": motion_data[frame_idx:frame_idx + 75].tolist()
                        })
                    else:
                        frames.append({
                            "frame": i,
                            "timestamp": i / fps,
                            "joints": [{"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}] * 24
                        })
                return frames
            except Exception:
                pass
        
        # Fallback: return placeholder frames
        return [
            {
                "frame": i,
                "timestamp": i / fps,
                "joints": [{"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}] * 24,
                "root_position": [0.0, 0.0, 0.0]
            }
            for i in range(num_frames)
        ]
    
    def _generate_Sample_motion(
        self,
        prompt: str,
        duration_s: int
    ) -> Dict[str, Any]:
        """
        Generate Sample motion data for development/testing.
        """
        fps = 30
        num_frames = duration_s * fps
        
        frames = []
        for i in range(num_frames):
            frame = {
                "timestamp": i / fps,
                "joints": [
                    {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}
                ] * 24,  # 24 SMPL joints
                "root_position": [0.0, 0.0, 0.0]
            }
            frames.append(frame)
        
        return {
            "frames": frames,
            "predictedActionLabel": "peek",
            "duration_s": duration_s,
            "fps": fps,
            "storage_url": f"Sample://motion_{hash(prompt)}_{duration_s}.json",
            "metadata": {
                "prompt": prompt,
                "generated_at": "2024-01-01T00:00:00Z",
                "model": "HY-Motion-1.0-Sample"
            }
        }

# Global client instance for backward compatibility
hy_motion_client = HYMotionClient()



