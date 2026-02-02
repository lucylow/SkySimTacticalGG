# app/schemas_hitl.py
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReviewCreate(BaseModel):
    review_id: str
    run_id: str
    agent_name: str
    reason: Optional[str]
    metadata: Optional[Dict[str, Any]] = {}

class ReviewOut(BaseModel):
    id: int
    review_id: str
    run_id: str
    agent_name: str
    reason: Optional[str]
    status: str
    assigned_to: Optional[str]
    metadata: Optional[Dict[str, Any]]
    final_result: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    author: str
    body: str

class ActionCreate(BaseModel):
    actor: str
    action: str  # approve, reject, request_edit, escalate
    payload: Optional[Dict[str, Any]] = {}


