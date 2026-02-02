# app/celery_orchestrator.py
from app.celery_app import celery
from app.celery_tasks_agents import run_agent_task
from app.router import Router
from app.utils.message_bus import MessageBus
from app.utils.redis_client import get_redis
from celery import group
import time
import uuid
import json
import structlog

log = structlog.get_logger()
router = Router()
message_bus = MessageBus()
redis = get_redis()

def speculative_race_on_redis(agent_specs, payload, timeout_s=20, task_id=None):
    """
    Launch agent tasks with a generated spec_id. Subscribe to channel 'speculative:{spec_id}' and
    return the first published successful result (parsed JSON). If timeout, returns None.
    agent_specs: list of tuples (agent_name, queue_name)
    payload: base payload to send (dict); the helper will insert '_spec_id'
    """
    spec_id = str(uuid.uuid4())
    channel = f"speculative:{spec_id}"
    pubsub = redis.pubsub(ignore_subscribe_messages=True)
    pubsub.subscribe(channel)

    async_results = []
    try:
        # launch agent tasks with the spec id
        for agent_name, queue_name in agent_specs:
            task_payload = dict(payload) if isinstance(payload, dict) else {"payload": payload}
            task_payload["_spec_id"] = spec_id
            ar = run_agent_task.apply_async(args=(agent_name, task_payload), queue=queue_name)
            async_results.append(ar)

        start = time.time()
        winner = None
        # Blocking loop but we depend on Redis push; get_message is lightweight
        while time.time() - start < timeout_s:
            msg = pubsub.get_message(timeout=1)
            if msg and msg.get("data"):
                try:
                    data = json.loads(msg["data"])
                    # data expected: {"agent":..., "result":..., "task_id":...}
                    winner = data
                    break
                except Exception:
                    # ignore malformed messages
                    continue
        # if winner found, optionally revoke others
        if winner:
            winner_task_id = winner.get("task_id")
            # revoke other running tasks
            for ar in async_results:
                try:
                    if ar.id != winner_task_id:
                        ar.revoke(terminate=True)
                except Exception:
                    # ignore revoke errors
                    pass
        return winner
    finally:
        try:
            pubsub.unsubscribe(channel)
            pubsub.close()
        except Exception:
            pass

@celery.task(bind=True)
def run_orchestration(self, payload: dict):
    task_id = self.request.id
    message_bus.publish({"task_id": task_id, "stage": "orchestration:started"})
    try:
        # Basic idempotency key (optional)
        idem_key = f"idem:{payload.get('match_id')}:{payload.get('round')}"
        if redis.get(idem_key):
            message_bus.publish({"task_id": task_id, "stage": "skipped", "reason": "idempotent"})
            return {"skipped": True}
        redis.set(idem_key, task_id, ex=300)

        # 1) Perception -> Prompt pipeline (sequential)
        perc_agent, perc_queue = router.pick_agent(["perception"])
        if not perc_agent:
            raise RuntimeError("No perception agent available")

        # run perception
        perc_ar = run_agent_task.apply_async(args=(perc_agent, payload), queue=perc_queue)
        perc_res = perc_ar.get(timeout=15)
        message_bus.publish({"task_id": task_id, "stage": "perception:done", "meta": perc_res})

        # merge perception output into payload for prompt agent
        prompt_payload = {**payload, **(perc_res.get("result") or {})}
        prompt_agent, prompt_queue = router.pick_agent(["nl_generation"])
        if not prompt_agent:
            raise RuntimeError("No prompt generator available")

        prompt_ar = run_agent_task.apply_async(args=(prompt_agent, prompt_payload), queue=prompt_queue)
        prompt_res = prompt_ar.get(timeout=12)
        message_bus.publish({"task_id": task_id, "stage": "prompt:done", "meta": prompt_res})

        # 2) Speculative motion generation: primary + backup (race via Redis pub/sub)
        # pick primary + backup (could be same agent config but different queues in real infra)
        primary_agent, primary_queue = router.pick_agent(["motion_generation"])
        backup_agent, backup_queue = router.pick_agent(["motion_generation"])
        agent_specs = []
        if primary_agent:
            agent_specs.append((primary_agent, primary_queue))
        # include backup only if different
        if backup_agent and (backup_agent, backup_queue) != (primary_agent, primary_queue):
            agent_specs.append((backup_agent, backup_queue))

        if not agent_specs:
            raise RuntimeError("No motion generator candidates available")

        prompt_text = prompt_res.get("result", {}).get("prompt") if isinstance(prompt_res.get("result"), dict) else prompt_res.get("result")
        spec_payload = {"prompt": prompt_text}
        message_bus.publish({"task_id": task_id, "stage": "motion:speculative_start", "candidates": [a for a,_ in agent_specs]})

        spec_winner = speculative_race_on_redis(agent_specs, spec_payload, timeout_s=20, task_id=task_id)
        if not spec_winner:
            message_bus.publish({"task_id": task_id, "stage": "motion:failed"})
            raise RuntimeError("Motion generation failed (no speculative winner)")

        message_bus.publish({"task_id": task_id, "stage": "motion:done", "meta": spec_winner})

        # 3) Validators (fan-out group)
        validators = [name for name, _ in router.choose_agents_for_capability(["validation", "scoring"])]
        if validators:
            val_tasks = [run_agent_task.s(name, spec_winner.get("result")) for name in validators]
            grp = group(val_tasks)
            val_group = grp.apply_async()
            val_results = val_group.get(timeout=20)
            message_bus.publish({"task_id": task_id, "stage": "validators:done", "meta": val_results})
        else:
            message_bus.publish({"task_id": task_id, "stage": "validators:skipped", "reason": "none_registered"})
            val_results = []

        # 4) Finalize (store, notify)
        frames = len(spec_winner.get("result", {}).get("frames", [])) if spec_winner.get("result") else 0
        message_bus.publish({"task_id": task_id, "stage": "completed", "frames": frames})
        return {"ok": True, "frames": frames}
    except Exception as e:
        message_bus.publish({"task_id": task_id, "stage": "error", "error": str(e)})
        raise


