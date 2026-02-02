# app/tasks.py
from app.celery_app import celery
from app.orchestrator import Orchestrator, message_bus
import uuid
import structlog
import time
from celery.exceptions import SoftTimeLimitExceeded

log = structlog.get_logger()
orch = Orchestrator()

@celery.task(bind=True, soft_time_limit=120)
def run_orchestration(self, payload):
    """
    Entrypoint Celery task. This demonstrates:
    - idempotency check
    - pipeline -> speculative step -> fan-in -> finalization
    """
    task_id = self.request.id
    task_ctx = {"task_id": task_id}
    log.info("orchestration:start", task_id=task_id)

    # idempotency
    idempotency_key = f"idem:{payload.get('match_id')}:{payload.get('round')}"
    r = orch.redis
    if r.get(idempotency_key):
        orch.publish({"task_id": task_id, "stage": "skipped", "reason": "idempotent"})
        return {"skipped": True}
    r.set(idempotency_key, task_id, ex=300)

    try:
        # 1) Sequential perception -> prompt
        seq = [["perception"], ["nl_generation"]]
        orchestrated = orch.pipeline(seq, payload, task_ctx)

        # 2) speculative motion generation: try motion_generator primary, and a backup 'motion_generator' (in real: local vs remote)
        primary_spec = ["motion_generation"]
        backup_spec = ["motion_generation"]  # can be different (remote vs local)
        winner = orch.speculative_first_response(primary_spec, backup_spec, {"prompt": orchestrated.get("prompt")}, task_ctx, timeout_s=12)
        if winner:
            role, winner_res = winner
            orch.publish({"task_id": task_id, "stage": "motion_selected", "role": role, "meta": winner_res})
            motion_result = winner_res.get("result") if isinstance(winner_res, dict) else winner_res
        else:
            orch.publish({"task_id": task_id, "stage": "motion_failed"})
            raise RuntimeError("Motion generation failed")

        # 3) fan-out validators (example: fast heuristic + slow ensemble)
        validators = ["validator"]  # capability -> router will pick
        val_results = orch.fan_out_fan_in(validators, motion_result, task_ctx, timeout_s=6)
        orch.publish({"task_id": task_id, "stage": "validators_done", "validators": val_results})

        # finalize: store result pointer (omitted), publish finished
        orch.publish({"task_id": task_id, "stage": "completed", "motion_meta": {"frames": len(motion_result.get("frames", []))}})
        return {"ok": True, "motion_meta": {"frames": len(motion_result.get("frames", []))}}
    except SoftTimeLimitExceeded:
        orch.publish({"task_id": task_id, "stage": "timed_out"})
        raise
    except Exception as e:
        orch.publish({"task_id": task_id, "stage": "error", "error": str(e)})
        raise
