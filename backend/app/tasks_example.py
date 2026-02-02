# app/tasks_example.py
"""
Example: How to integrate agent data persistence into your Celery tasks.

This shows how to use the persistence and ingestion helpers in your agent tasks.
"""
import uuid
import time
from datetime import datetime
from app.persistence import create_agent_run, update_agent_run_status
from app.ingest import ingest_agent_success
from app.provenance import make_provenance

# Example: Celery task that generates motion
def run_agent_task_example(payload: dict):
    """
    Example agent task that:
    1. Creates a run record before starting
    2. Updates status when running
    3. Ingests results when complete
    """
    run_id = payload.get("run_id") or str(uuid.uuid4())
    agent_name = payload.get("agent_name", "motion_generator")
    
    # Step 1: Create run record BEFORE executing heavy work
    provenance = make_provenance(
        model_name="hymotion-3b",
        model_version="v2025-01-01",
        prompt_template="tactical_motion_v1",
        prompt_text=payload.get("prompt"),
        extra_config=payload.get("config", {})
    )
    
    create_agent_run(
        run_id=run_id,
        agent_name=agent_name,
        input_payload=payload,
        provenance=provenance,
        status="running"
    )
    
    started_at = time.time()
    
    try:
        # Step 2: Do your agent work here
        # ... generate motion, process data, etc ...
        
        # Simulated result
        result_summary = {
            "action": "peek",
            "frames": 180,
            "fps": 30,
            "label": "entry_peek"
        }
        
        # Simulated artifacts (e.g., SMPL motion data)
        artifacts = [
            {
                "name": "motion.smpl.json",
                "data": b'{"frames": [...]}',  # or bytes
                "content_type": "application/json",
                "meta": {
                    "joint_format": "quaternion",
                    "fps": 30,
                    "frames_count": 180
                }
            }
        ]
        
        # Simulated metrics
        metrics = {
            "confidence": 0.92,
            "n_frames": 180,
            "quality_score": 0.85
        }
        
        finished_at = time.time()
        
        # Step 3: Ingest results (saves artifacts, metrics, updates status)
        ingest_agent_success(
            run_id=run_id,
            result=result_summary,
            artifacts=artifacts,
            metrics=metrics,
            started_at=started_at,
            finished_at=finished_at
        )
        
        return {"run_id": run_id, "status": "success", "result": result_summary}
        
    except Exception as e:
        # On failure, update status
        update_agent_run_status(run_id, "failed", result_summary={"error": str(e)})
        raise

# Example: Using with Celery decorator
# from celery import Celery
# from app.celery_app import celery_app
# 
# @celery_app.task(name="app.tasks.run_motion_generator")
# def run_motion_generator(payload: dict):
#     return run_agent_task_example(payload)


