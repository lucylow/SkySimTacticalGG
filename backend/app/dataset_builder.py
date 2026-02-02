# app/dataset_builder.py
import pandas as pd
from .db import SessionLocal
from .models import AgentRun, Artifact, AgentMetric
from datetime import datetime
import pyarrow as pa
import pyarrow.parquet as pq
import json
from typing import List

def runs_to_dataframe(runs: List[AgentRun]):
    rows = []
    for r in runs:
        row = {
            "run_id": r.run_id,
            "agent_name": r.agent_name,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            "duration_s": r.duration_s,
            "result_summary": json.dumps(r.result_summary) if r.result_summary else None,
            "provenance": json.dumps(r.provenance) if r.provenance else None,
            "n_artifacts": len(r.artifacts) if r.artifacts else 0
        }
        # flatten some metrics (e.g., confidence)
        for m in r.metrics:
            if m.key not in row:
                row[m.key] = m.value
        rows.append(row)
    return pd.DataFrame(rows)

def export_runs_to_parquet(output_path: str, agent_name: str = None, limit: int = 1000):
    db = SessionLocal()
    try:
        q = db.query(AgentRun)
        if agent_name:
            q = q.filter(AgentRun.agent_name == agent_name)
        runs = q.order_by(AgentRun.created_at.desc()).limit(limit).all()
        df = runs_to_dataframe(runs)
        df.to_parquet(output_path, engine="pyarrow", index=False)
        return output_path
    finally:
        db.close()


