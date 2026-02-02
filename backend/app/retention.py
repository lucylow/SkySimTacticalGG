# app/retention.py
from .db import SessionLocal
from .models import AgentRun, Artifact
from datetime import datetime, timedelta
from .storage import s3
import os

# delete artifacts older than n days and then delete DB rows
def cleanup_older_than(days: int = 30):
    cutoff = datetime.utcnow() - timedelta(days=days)
    db = SessionLocal()
    try:
        old_runs = db.query(AgentRun).filter(AgentRun.created_at < cutoff).all()
        for r in old_runs:
            for a in r.artifacts:
                try:
                    # parse s3 key
                    bucket = os.getenv("S3_BUCKET", "agent-artifacts")
                    s3.delete_object(Bucket=bucket, Key=a.s3_key)
                except Exception:
                    pass
            db.delete(r)
        db.commit()
    finally:
        db.close()


