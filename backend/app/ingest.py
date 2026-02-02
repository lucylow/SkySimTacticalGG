# app/ingest.py
from datetime import datetime
from .persistence import update_agent_run_status, save_artifact, add_metric
from .storage import upload_bytes
import json
import base64
import time

def ingest_agent_success(run_id: str, result: dict, artifacts:list = None, metrics: dict = None, started_at:float=None, finished_at:float=None):
    """
    Called when an agent finishes successfully.
    - run_id: the run id used to create the AgentRun record earlier
    - result: dict summary, e.g., {"action":"move","frames":123,"labels": [...]}
    - artifacts: list of dicts: {"name":"motion.smpl.json","data": bytes or base64 string, "content_type":"application/json", "meta": {...}}
    - metrics: dict of key->value (e.g., {"confidence":0.92})
    """
    start_ts = datetime.fromtimestamp(started_at) if started_at else None
    end_ts = datetime.fromtimestamp(finished_at) if finished_at else None
    duration_s = int((finished_at - started_at)) if (started_at and finished_at) else None

    # update run status
    update_agent_run_status(run_id, "success", started_at=start_ts, finished_at=end_ts, duration_s=duration_s, result_summary=result)

    # save metrics
    if metrics:
        for k, v in metrics.items():
            # convert numeric to string; store both numeric and string where possible
            numeric = None
            try:
                numeric = int(v) if isinstance(v, int) or (isinstance(v, float) and v.is_integer()) else None
            except Exception:
                numeric = None
            add_metric(run_id, k, str(v), numeric_value=numeric)

    # save artifacts
    saved = []
    if artifacts:
        for art in artifacts:
            name = art.get("name")
            content_type = art.get("content_type","application/octet-stream")
            meta = art.get("meta",{})
            data = art.get("data")
            # if base64 string is provided, decode
            if isinstance(data, str):
                try:
                    # accept both raw JSON string or base64
                    if art.get("encoding") == "base64":
                        data_bytes = base64.b64decode(data)
                    else:
                        data_bytes = data.encode("utf-8")
                except Exception:
                    data_bytes = data.encode("utf-8")
            else:
                data_bytes = data
            a = save_artifact(run_id, name, data_bytes, content_type, meta)
            saved.append(a)
    return {"ok": True, "saved_artifacts": [s.id for s in saved]}


