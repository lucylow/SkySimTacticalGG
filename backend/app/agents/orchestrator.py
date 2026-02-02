"""
Orchestrator Agent
Coordinates the multi-agent workflow: micro analysis → prompt generation → motion generation → validation.
"""
from app.agents.micro_detector import detect_micro_mistakes
from app.agents.prompt_generator import build_motion_prompt, build_scene_descriptor
from app.agents.motion_generator import call_hy_motion
from app.utils.message_bus import message_bus
from app.utils.validator import PredictionValidator
from typing import Dict, Any, Optional
import os

def orchestrate_insight_workflow(
    payload: Dict[str, Any],
    task_id: str
) -> Dict[str, Any]:
    """
    Orchestrate the complete multi-agent workflow.
    
    Pipeline:
    1. Micro analysis (detect mistakes, patterns)
    2. Build scene descriptor
    3. Generate motion prompt
    4. Call HY-Motion to generate motion
    5. Validate prediction
    6. Store motion and return result
    
    Args:
        payload: Request payload with match_id, round, grid_snapshot, etc.
        task_id: Celery task ID for tracking
    
    Returns:
        Result dict with motion_url, status, etc.
    """
    match_id = payload.get("match_id", "unknown")
    round_num = payload.get("round", 0)
    grid_snapshot = payload.get("grid_snapshot", {})
    round_meta = payload.get("round_meta", {})
    
    # Stage 1: Publish received status
    message_bus.publish({
        "task_id": task_id,
        "status": "received",
        "stage": "starting",
        "match_id": match_id,
        "round": round_num
    })
    
    try:
        # Stage 2: Micro analysis
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "micro_analysis"
        })
        
        micro_results = detect_micro_mistakes(grid_snapshot)
        
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "micro_done",
            "micro": {
                "summary": micro_results.get("summary", {}),
                "character_count": len(micro_results.get("characters", []))
            }
        })
        
        # Stage 3: Build scene descriptor and generate prompt
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "prompt_generation"
        })
        
        scene_descriptor = build_scene_descriptor(
            match_id=match_id,
            round=round_num,
            round_meta=round_meta,
            characters=micro_results.get("characters", []),
            directive=micro_results.get("directive", "")
        )
        
        prompt = build_motion_prompt(scene_descriptor)
        
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "prompt_generated",
            "prompt_preview": prompt[:200] + "..." if len(prompt) > 200 else prompt
        })
        
        # Stage 4: Call HY-Motion
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "motion_generation"
        })
        
        duration_s = payload.get("duration_s", 6)
        motion = call_hy_motion(prompt, duration_s=duration_s)
        
        if "error" in motion:
            message_bus.publish({
                "task_id": task_id,
                "status": "error",
                "stage": "motion_generation_failed",
                "error": motion["error"]
            })
            return {
                "ok": False,
                "error": motion["error"],
                "task_id": task_id
            }
        
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "motion_generated",
            "motion_meta": {
                "frames": len(motion.get("frames", [])),
                "duration_s": motion.get("duration_s", duration_s),
                "fps": motion.get("fps", 30)
            }
        })
        
        # Stage 5: Validate
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "validation"
        })
        
        validator = PredictionValidator()
        validation_result = validator.validate_prediction(
            match_id=match_id,
            motion_data=motion
        )
        
        message_bus.publish({
            "task_id": task_id,
            "status": "processing",
            "stage": "validated",
            "confidence": validation_result.get("overall_confidence", 0.0),
            "is_valid": validation_result.get("is_valid", False)
        })
        
        # Stage 6: Store motion (simplified - in production would upload to S3)
        storage_url = motion.get("storage_url")
        if not storage_url:
            # Generate a storage URL (in production, upload to S3)
            storage_url = f"motion://{match_id}_{round_num}_{task_id}.json"
        
        # Stage 7: Complete
        message_bus.publish({
            "task_id": task_id,
            "status": "completed",
            "stage": "done",
            "motion_url": storage_url,
            "confidence": validation_result.get("overall_confidence", 0.0)
        })
        
        return {
            "ok": True,
            "motion_url": storage_url,
            "task_id": task_id,
            "confidence": validation_result.get("overall_confidence", 0.0),
            "validation": validation_result
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"Orchestration error: {error_msg}")
        
        message_bus.publish({
            "task_id": task_id,
            "status": "error",
            "stage": "orchestration_failed",
            "error": error_msg
        })
        
        return {
            "ok": False,
            "error": error_msg,
            "task_id": task_id
        }


