# app/persistence.py
import uuid
import json
from datetime import datetime
from .db import SessionLocal
from .models import AgentRun, Artifact, AgentMetric
from .storage import upload_bytes, upload_fileobj
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import logging

logger = logging.getLogger(__name__)

def create_agent_run(run_id: str, agent_name: str, input_payload: dict, provenance: dict, status: str = "queued"):
    db: Session = SessionLocal()
    try:
        ar = AgentRun(
            run_id=run_id,
            agent_name=agent_name,
            status=status,
            input_payload=input_payload,
            provenance=provenance
        )
        db.add(ar)
        db.commit()
        db.refresh(ar)
        return ar
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating agent run {run_id}: {e}", exc_info=True)
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error creating agent run {run_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error creating agent run {run_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()

def update_agent_run_status(run_id: str, status: str, started_at=None, finished_at=None, duration_s=None, result_summary=None):
    db: Session = SessionLocal()
    try:
        ar = db.query(AgentRun).filter_by(run_id=run_id).first()
        if not ar:
            return None
        ar.status = status
        if started_at:
            ar.started_at = started_at
        if finished_at:
            ar.finished_at = finished_at
        if duration_s is not None:
            ar.duration_s = duration_s
        if result_summary:
            ar.result_summary = result_summary
        db.add(ar)
        db.commit()
        db.refresh(ar)
        return ar
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error updating agent run status {run_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error updating agent run status {run_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()

def save_artifact(run_id: str, name: str, data: bytes, content_type: str, meta: dict):
    db: Session = SessionLocal()
    try:
        if not run_id:
            raise ValueError("run_id is required")
        if not name:
            raise ValueError("artifact name is required")
        if not data:
            raise ValueError("artifact data cannot be empty")
        
        ar = db.query(AgentRun).filter_by(run_id=run_id).first()
        if not ar:
            raise ValueError(f"Run {run_id} not found")
        
        key = f"{ar.agent_name}/{run_id}/{uuid.uuid4().hex}/{name}"
        try:
            upload_bytes(data, key, content_type=content_type)
        except Exception as e:
            logger.error(f"Error uploading artifact to storage for run {run_id}: {e}", exc_info=True)
            raise ValueError(f"Failed to upload artifact: {str(e)}")
        
        artifact = Artifact(agent_run_id=ar.id, name=name, s3_key=key, content_type=content_type, size_bytes=len(data), meta=meta)
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        return artifact
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        logger.error(f"Error saving artifact for run {run_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error saving artifact for run {run_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()

def save_artifact_from_fileobj(run_id: str, name: str, fileobj, content_type: str, meta: dict):
    db: Session = SessionLocal()
    try:
        if not run_id:
            raise ValueError("run_id is required")
        if not name:
            raise ValueError("artifact name is required")
        if not fileobj:
            raise ValueError("fileobj is required")
        
        ar = db.query(AgentRun).filter_by(run_id=run_id).first()
        if not ar:
            raise ValueError(f"Run {run_id} not found")
        
        key = f"{ar.agent_name}/{run_id}/{uuid.uuid4().hex}/{name}"
        # Get file size before uploading
        try:
            current_pos = fileobj.tell()
            fileobj.seek(0, 2)  # seek to end
            size_bytes = fileobj.tell()
            fileobj.seek(current_pos)  # restore position
        except Exception as e:
            logger.error(f"Error getting file size for artifact: {e}", exc_info=True)
            raise ValueError(f"Failed to read file object: {str(e)}")
        
        try:
            upload_fileobj(fileobj, key, content_type=content_type)
        except Exception as e:
            logger.error(f"Error uploading artifact fileobj to storage for run {run_id}: {e}", exc_info=True)
            raise ValueError(f"Failed to upload artifact: {str(e)}")
        
        artifact = Artifact(agent_run_id=ar.id, name=name, s3_key=key, content_type=content_type, size_bytes=size_bytes, meta=meta)
        db.add(artifact)
        db.commit()
        db.refresh(artifact)
        return artifact
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        logger.error(f"Error saving artifact from fileobj for run {run_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error saving artifact from fileobj for run {run_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()

def add_metric(run_id: str, key: str, value: str, numeric_value: int = None):
    db: Session = SessionLocal()
    try:
        if not run_id:
            raise ValueError("run_id is required")
        if not key:
            raise ValueError("metric key is required")
        if value is None:
            raise ValueError("metric value is required")
        
        ar = db.query(AgentRun).filter_by(run_id=run_id).first()
        if not ar:
            raise ValueError(f"Run {run_id} not found")
        
        m = AgentMetric(agent_run_id=ar.id, key=key, value=value, numeric_value=numeric_value)
        db.add(m)
        db.commit()
        db.refresh(m)
        return m
    except (ValueError, SQLAlchemyError) as e:
        db.rollback()
        logger.error(f"Error adding metric for run {run_id}: {e}", exc_info=True)
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error adding metric for run {run_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()

