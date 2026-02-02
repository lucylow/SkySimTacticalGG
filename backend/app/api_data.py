# app/api_data.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from .db import SessionLocal, init_db
from .models import AgentRun, Artifact
from .schemas import AgentRunCreate, AgentRunOut, ArtifactOut
from typing import List, Optional
from .storage import generate_presigned_url
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/data", tags=["agent-data"])

# dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/runs", response_model=AgentRunOut)
def create_run(payload: AgentRunCreate):
    # create a run record (used to create before scheduling)
    try:
        from .persistence import create_agent_run
        ar = create_agent_run(payload.run_id, payload.agent_name, payload.input_payload or {}, payload.provenance.dict() if payload.provenance else {})
        return ar
    except IntegrityError as e:
        logger.error(f"Integrity error creating run: {e}", exc_info=True)
        raise HTTPException(status_code=409, detail=f"Run with ID {payload.run_id} already exists")
    except Exception as e:
        logger.error(f"Error creating run: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create agent run")

@router.get("/runs/{run_id}", response_model=AgentRunOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    try:
        r = db.query(AgentRun).filter_by(run_id=run_id).first()
        if not r:
            raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
        return r
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error getting run {run_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error getting run {run_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/runs", response_model=List[AgentRunOut])
def list_runs(agent_name: Optional[str] = None, status: Optional[str]=None, limit:int=50, db: Session = Depends(get_db)):
    try:
        if limit < 1 or limit > 1000:
            raise HTTPException(status_code=400, detail="limit must be between 1 and 1000")
        
        q = db.query(AgentRun)
        if agent_name:
            q = q.filter(AgentRun.agent_name==agent_name)
        if status:
            q = q.filter(AgentRun.status==status)
        q = q.order_by(AgentRun.created_at.desc()).limit(limit)
        return q.all()
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error listing runs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error listing runs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/artifacts/{artifact_id}", response_model=ArtifactOut)
def get_artifact(artifact_id: int, db: Session = Depends(get_db)):
    try:
        if artifact_id < 1:
            raise HTTPException(status_code=400, detail="artifact_id must be positive")
        
        a = db.query(Artifact).filter_by(id=artifact_id).first()
        if not a:
            raise HTTPException(status_code=404, detail=f"Artifact {artifact_id} not found")
        
        # add presigned_url
        try:
            presigned = generate_presigned_url(a.s3_key)
        except Exception as e:
            logger.error(f"Error generating presigned URL for artifact {artifact_id}: {e}", exc_info=True)
            presigned = None
        
        data = ArtifactOut.model_validate(a).model_dump()
        data["download_url"] = presigned
        return data
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logger.error(f"Database error getting artifact {artifact_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error")
    except Exception as e:
        logger.error(f"Error getting artifact {artifact_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

