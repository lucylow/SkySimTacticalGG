# app/schemas.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class Provenance(BaseModel):
    model_name: Optional[str]
    model_version: Optional[str]
    code_version: Optional[str]
    prompt_template: Optional[str]
    prompt_text: Optional[str]
    deterministic_seed: Optional[int]
    agent_config_hash: Optional[str]

class ArtifactOut(BaseModel):
    id: int
    name: str
    s3_key: str
    content_type: str
    size_bytes: int
    meta: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class MetricOut(BaseModel):
    id: int
    key: str
    value: str
    numeric_value: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class AgentRunCreate(BaseModel):
    run_id: str
    agent_name: str
    input_payload: Optional[Dict[str, Any]]
    provenance: Optional[Provenance]

class AgentRunOut(BaseModel):
    id: int
    run_id: str
    agent_name: str
    status: str
    result_summary: Optional[Dict[str, Any]]
    created_at: datetime
    started_at: Optional[datetime]
    finished_at: Optional[datetime]
    duration_s: Optional[int]
    provenance: Optional[Provenance]
    artifacts: List[ArtifactOut] = []
    metrics: List[MetricOut] = []

    class Config:
        from_attributes = True

# ============================================================================
# GRID Data Ingestion Schemas
# ============================================================================

class GridRawEvent(BaseModel):
    # adapt to GRID payload fields; keep flexible
    grid_event_id: Optional[str]
    match_id: str
    event_type: str
    game_time: Optional[float]
    payload: Dict[str, Any]
    seq: Optional[int]  # sequence number if available

class CanonicalEvent(BaseModel):
    event_id: str  # uuid or grid_event_id
    match_id: str
    event_type: str
    timestamp: datetime
    actor: Optional[str]
    target: Optional[str]
    team: Optional[str]
    payload: Dict[str, Any]
    enriched: Dict[str, Any] = {}
    ingestion_meta: Dict[str, Any] = {}

