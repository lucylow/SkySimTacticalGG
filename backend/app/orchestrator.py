# app/orchestrator.py
from app.router import Router
from app.agents.registry import auto_import_agents, get_agent
from app.utils.message_bus import MessageBus
from typing import Dict, Any
import structlog
import time
import threading
from app.utils.redis_client import get_redis

log = structlog.get_logger()
auto_import_agents()  # make sure registry is populated

router = Router()
message_bus = MessageBus()
redis = get_redis()

# simple idempotency key helper
def idempotency_key_for(payload):
    return f"idem:{payload.get('match_id')}:{payload.get('round')}"

class Orchestrator:
    """
    Orchestrator coordinates agents using router and supports:
    - pipeline (sequential chain)
    - fan-out / fan-in (parallel agents -> gather results)
    - speculative execution (run primary + backup in parallel, take first)
    - timeouts, retries, cancellation, simple fallback
    """

    def __init__(self):
        self.router = router
        self.message_bus = message_bus
        self.redis = redis

    def publish(self, payload):
        self.message_bus.publish(payload)

    def _run_agent_sync(self, agent_name: str, payload: Dict[str, Any], task_ctx: Dict):
        """
        Run an agent synchronously in-process. If you use Celery tasks for each agent,
        this can be a thin wrapper that calls the Celery task synchronously or triggers the worker.
        """
        AgentCls = get_agent(agent_name)
        cfg = self.router.config.get(agent_name, {})
        agent = AgentCls(cfg)
        try:
            self.publish({"task_id": task_ctx["task_id"], "stage": f"{agent_name}:start"})
            res = agent.execute(payload)
            self.publish({"task_id": task_ctx["task_id"], "stage": f"{agent_name}:done", "agent": agent_name, "meta": res})
            return res
        finally:
            # release router slot (must be called even if agent raises)
            self.router.release_slot(agent_name)

    def pipeline(self, ordered_agents: list, initial_payload: dict, task_ctx: dict):
        """
        Simple sequential pipeline: for each agent, pick a physical agent, run it, and pass results to next.
        ordered_agents: list of capability lists or explicit agent names
        """
        data = initial_payload
        for step in ordered_agents:
            # step may be a string (agent name) or capability list
            if isinstance(step, str):
                agent_name = step
            else:
                agent_name, _ = self.router.pick_agent(step)
                if not agent_name:
                    raise RuntimeError(f"No agent found for {step}")

            # run (synchronously here)
            try:
                res = self._run_agent_sync(agent_name, data, task_ctx)
            except Exception as e:
                self.publish({"task_id": task_ctx["task_id"], "stage": "error", "error": str(e)})
                raise
            # merge or set data for next step
            data = {**data, **(res.get("result") if isinstance(res, dict) else res)}
        return data

    def fan_out_fan_in(self, agent_specs: list, payload: dict, task_ctx: dict, timeout_s=10):
        """
        Run agents in parallel threads (local example). agent_specs is list of agent_names or capability lists.
        Wait for all, gather results.
        """
        results = []
        threads = []
        lock = threading.Lock()

        def run_and_collect(spec):
            if isinstance(spec, str):
                agent_name = spec
            else:
                agent_name, _ = self.router.pick_agent(spec)
            if not agent_name:
                with lock:
                    results.append({"agent": None, "error": "no_agent"})
                return
            try:
                res = self._run_agent_sync(agent_name, payload, task_ctx)
                with lock:
                    results.append(res)
            except Exception as e:
                with lock:
                    results.append({"agent": agent_name, "error": str(e)})

        for spec in agent_specs:
            t = threading.Thread(target=run_and_collect, args=(spec,), daemon=True)
            t.start()
            threads.append(t)

        start = time.time()
        for t in threads:
            elapsed = time.time() - start
            remaining = max(0, timeout_s - elapsed)
            t.join(remaining)

        # record which threads are still alive -> timeout
        for t in threads:
            if t.is_alive():
                self.publish({"task_id": task_ctx["task_id"], "stage": "timeout", "detail": "one or more agents timed out"})

        return results

    def speculative_first_response(self, primary_spec, backup_spec, payload, task_ctx, timeout_s=10):
        """
        Launch primary and backup in parallel; return whichever completes first successfully.
        """
        results = {}
        threads = []

        def run_agent(role, spec):
            if isinstance(spec, str):
                name = spec
            else:
                name, _ = self.router.pick_agent(spec)
            if not name:
                results[role] = {"error": "no_agent"}
                return
            try:
                res = self._run_agent_sync(name, payload, task_ctx)
                results[role] = res
            except Exception as e:
                results[role] = {"error": str(e)}

        t1 = threading.Thread(target=run_agent, args=("primary", primary_spec), daemon=True)
        t2 = threading.Thread(target=run_agent, args=("backup", backup_spec), daemon=True)
        t1.start(); t2.start()

        start = time.time()
        winner = None
        while time.time() - start < timeout_s:
            if "primary" in results and "error" not in results["primary"]:
                winner = ("primary", results["primary"]); break
            if "backup" in results and "error" not in results["backup"]:
                winner = ("backup", results["backup"]); break
            time.sleep(0.05)
        # no winner within timeout -> prefer primary if it eventually arrives
        if not winner:
            if "primary" in results and "error" not in results["primary"]:
                winner = ("primary", results["primary"])
            elif "backup" in results and "error" not in results["backup"]:
                winner = ("backup", results["backup"])

        # join threads non-blocking after winner (allow background tasks to finish but release slots)
        return winner

    def is_cancelled(self, task_id: str):
        flag = self.redis.get(f"cancel:{task_id}")
        return flag == "1"

    def request_cancel(self, task_id: str):
        self.redis.set(f"cancel:{task_id}", "1", ex=60)

