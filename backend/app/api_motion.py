# app/api_motion.py
"""
API endpoints for HY-Motion 1.0 integration
Generates 3D character animations from text prompts using Tencent HY-Motion-1.0
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from pathlib import Path
import asyncio
from app.hy_motion_client import HYMotionClient
from app.settings import settings
import structlog

log = structlog.get_logger()

router = APIRouter(prefix="/api/v1/motion", tags=["motion"])

# Initialize HY-Motion client
hy_motion_client = HYMotionClient()


class MotionGenerationRequest(BaseModel):
    """Request to generate motion from text prompt"""
    prompt: str = Field(..., description="Text description of motion (< 60 words recommended)", max_length=500)
    duration_seconds: float = Field(default=6.0, ge=0.5, le=30.0, description="Duration of motion in seconds")
    match_id: Optional[str] = None
    player_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class MotionGenerationResponse(BaseModel):
    """Response from motion generation"""
    job_id: str
    status: str
    message: str
    prompt: str


class MotionDataResponse(BaseModel):
    """Motion data response"""
    frames: list
    duration_s: float
    fps: int
    predictedActionLabel: str
    storage_url: Optional[str] = None
    metadata: Dict[str, Any]


@router.post("/generate", response_model=MotionGenerationResponse)
async def generate_motion(request: MotionGenerationRequest, background_tasks: BackgroundTasks):
    """
    Generate 3D motion animation from text prompt using HY-Motion-1.0
    
    This endpoint accepts a text prompt and generates a 3D character animation.
    The actual generation happens asynchronously. Returns a job ID that can be
    used to check status or receive updates via WebSocket.
    
    **HY-Motion 1.0 Integration:**
    - Uses Tencent HY-Motion-1.0 model for motion generation
    - Supports prompts up to 60 words (recommended)
    - Outputs motion data in SMPL format (can be converted to GLTF/BVH)
    - For more info: https://github.com/Tencent-Hunyuan/HY-Motion-1.0
    """
    try:
        # Validate prompt length (HY-Motion recommendation: < 60 words)
        word_count = len(request.prompt.split())
        if word_count > 60:
            log.warning(f"Prompt exceeds 60 words ({word_count}), may affect quality")
        
        # Generate motion using HY-Motion-1.0
        # This is a synchronous operation, so we run it in a thread
        import uuid
        job_id = str(uuid.uuid4())
        
        # Run motion generation in background
        background_tasks.add_task(
            _generate_motion_task,
            job_id,
            request.prompt,
            request.duration_seconds,
            request.metadata or {}
        )
        
        return MotionGenerationResponse(
            job_id=job_id,
            status="queued",
            message="Motion generation queued",
            prompt=request.prompt
        )
    except Exception as e:
        log.error("Error queuing motion generation", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to queue motion generation: {str(e)}")


async def _generate_motion_task(
    job_id: str,
    prompt: str,
    duration_seconds: float,
    metadata: Dict[str, Any]
):
    """Background task to generate motion"""
    try:
        log.info("Starting motion generation", job_id=job_id, prompt=prompt[:50])
        
        # Call HY-Motion-1.0 client
        result = hy_motion_client.generate_from_prompt(
            prompt=prompt,
            duration_seconds=duration_seconds
        )
        
        # TODO: Store result and notify via WebSocket
        # For now, log the result
        log.info("Motion generation completed", job_id=job_id, format=result.get("format"))
        
    except Exception as e:
        log.error("Motion generation failed", job_id=job_id, error=str(e))


@router.post("/generate-sync", response_model=MotionDataResponse)
async def generate_motion_sync(request: MotionGenerationRequest):
    """
    Generate 3D motion animation synchronously (for testing/simple use cases)
    
    **Note:** This blocks until generation completes. For production use,
    prefer the `/generate` endpoint with async job processing.
    """
    try:
        # Validate prompt
        word_count = len(request.prompt.split())
        if word_count > 60:
            log.warning(f"Prompt exceeds 60 words ({word_count})")
        
        # Generate motion
        result = hy_motion_client.generate_from_prompt(
            prompt=request.prompt,
            duration_seconds=request.duration_seconds
        )
        
        # Parse result into expected format
        artifact_bytes = result.get("artifact_bytes")
        format_type = result.get("format", "npy")
        fps = 30
        num_frames = int(request.duration_seconds * fps)
        
        # Convert to frame format (simplified - actual parsing depends on HY-Motion output format)
        frames = _parse_motion_artifact(artifact_bytes, format_type, num_frames, fps)
        
        return MotionDataResponse(
            frames=frames,
            duration_s=request.duration_seconds,
            fps=fps,
            predictedActionLabel=request.prompt[:50],
            storage_url=None,  # Would be set if uploaded to S3
            metadata={
                "prompt": request.prompt,
                "format": format_type,
                "model": "HY-Motion-1.0",
                **(request.metadata or {}),
                **result.get("meta", {})
            }
        )
    except Exception as e:
        log.error("Error generating motion", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate motion: {str(e)}")


def _parse_motion_artifact(
    artifact_bytes: Optional[bytes],
    format_type: str,
    num_frames: int,
    fps: int
) -> list:
    """
    Parse motion artifact bytes into frame format.
    
    HY-Motion-1.0 outputs motion data in various formats:
    - NPY: NumPy array with SMPL parameters
    - GLTF: 3D model format (if exported)
    - BVH: Motion capture format (if exported)
    """
    if not artifact_bytes:
        # Return placeholder frames
        return [
            {
                "frame": i,
                "timestamp": i / fps,
                "joints": [{"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}] * 24,
                "root_position": [0.0, 0.0, 0.0]
            }
            for i in range(num_frames)
        ]
    
    if format_type == "npy":
        try:
            import numpy as np
            motion_data = np.frombuffer(artifact_bytes, dtype=np.float32)
            frames = []
            
            # HY-Motion typically outputs SMPL parameters (75 params per frame)
            params_per_frame = 75
            for i in range(num_frames):
                frame_idx = i * params_per_frame
                if frame_idx + params_per_frame <= len(motion_data):
                    smpl_params = motion_data[frame_idx:frame_idx + params_per_frame].tolist()
                    frames.append({
                        "frame": i,
                        "timestamp": i / fps,
                        "smpl_params": smpl_params,
                        "joints": [{"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}] * 24,  # Placeholder
                        "root_position": [0.0, 0.0, 0.0]  # Placeholder
                    })
                else:
                    frames.append({
                        "frame": i,
                        "timestamp": i / fps,
                        "joints": [{"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0}] * 24,
                        "root_position": [0.0, 0.0, 0.0]
                    })
            return frames
        except Exception as e:
            log.warning(f"Failed to parse NPY format: {e}")
    
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

