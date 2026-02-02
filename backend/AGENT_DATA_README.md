# Agent Data Management System

This directory contains a complete implementation for managing AI agent data: inputs, outputs, events, metrics, and artifacts.

## Architecture

- **Database**: SQLAlchemy models for agent runs, artifacts, metrics, and prompt templates
- **Storage**: S3 for binary artifacts (motion files, GLTF, videos, etc.)
- **API**: FastAPI endpoints for querying runs and artifacts
- **Ingestion**: Helpers for agent tasks to persist results
- **Export**: Dataset builder for exporting to Parquet for ML training

## Files

### Core Components

- `db.py` - Database setup (SQLAlchemy engine, session, base)
- `models.py` - SQLAlchemy models (AgentRun, Artifact, AgentMetric, PromptTemplate)
- `schemas.py` - Pydantic schemas for validation and API
- `storage.py` - S3 helpers (upload, download, presigned URLs)
- `persistence.py` - DB operations (create runs, save artifacts, add metrics)
- `ingest.py` - High-level ingestion helper for agent tasks
- `provenance.py` - Helpers for computing code/config hashes

### API & Utilities

- `api_data.py` - FastAPI router for querying runs and artifacts
- `dataset_builder.py` - Export runs to Parquet for ML/analysis
- `retention.py` - Cleanup helpers for old data
- `main.py` - FastAPI app with router integration
- `tasks_example.py` - Example integration with Celery tasks

## Quick Start

### 1. Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/agent_data  # or sqlite:///./data/agent_data.db

# S3 Storage
S3_BUCKET=agent-artifacts
S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Optional
GIT_COMMIT_SHA=...  # for provenance tracking
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. Initialize Database

```python
from app.db import init_db
init_db()
```

Or the database will be initialized automatically when the FastAPI app starts.

### 3. Use in Agent Tasks

```python
from app.persistence import create_agent_run
from app.ingest import ingest_agent_success
from app.provenance import make_provenance

# Create run before starting
run_id = str(uuid.uuid4())
create_agent_run(
    run_id=run_id,
    agent_name="motion_generator",
    input_payload={"prompt": "..."},
    provenance=make_provenance(model_name="hymotion-3b"),
    status="running"
)

# ... do work ...

# Ingest results
ingest_agent_success(
    run_id=run_id,
    result={"frames": 180, "action": "peek"},
    artifacts=[{
        "name": "motion.smpl.json",
        "data": motion_bytes,
        "content_type": "application/json",
        "meta": {"fps": 30}
    }],
    metrics={"confidence": 0.92},
    started_at=start_time,
    finished_at=end_time
)
```

### 4. Query via API

```bash
# List runs
curl http://localhost:8000/api/v1/data/runs?agent_name=motion_generator&limit=10

# Get specific run
curl http://localhost:8000/api/v1/data/runs/{run_id}

# Get artifact with presigned URL
curl http://localhost:8000/api/v1/data/artifacts/{artifact_id}
```

## API Endpoints

- `POST /api/v1/data/runs` - Create a new agent run
- `GET /api/v1/data/runs` - List runs (filter by agent_name, status)
- `GET /api/v1/data/runs/{run_id}` - Get specific run with artifacts and metrics
- `GET /api/v1/data/artifacts/{artifact_id}` - Get artifact metadata + presigned download URL

## Data Model

### AgentRun
- `run_id` (unique) - UUID or custom identifier
- `agent_name` - Name of the agent
- `status` - queued, running, success, failed, cancelled
- `input_payload` - JSON input to the agent
- `result_summary` - Lightweight JSON summary (for fast queries)
- `provenance` - Model version, code version, prompt, seed, etc.
- Timestamps: `created_at`, `started_at`, `finished_at`, `duration_s`

### Artifact
- Linked to `AgentRun`
- `s3_key` - S3 object key
- `content_type` - MIME type
- `size_bytes` - File size
- `meta` - JSON metadata (fps, frames_count, joint_format, etc.)

### AgentMetric
- Linked to `AgentRun`
- `key` - Metric name (e.g., "confidence", "n_frames")
- `value` - String representation
- `numeric_value` - Numeric value for aggregation

## Export to Parquet

```python
from app.dataset_builder import export_runs_to_parquet

# Export all runs
export_runs_to_parquet("runs.parquet", limit=1000)

# Export specific agent
export_runs_to_parquet("motion_runs.parquet", agent_name="motion_generator", limit=500)
```

## Retention & Cleanup

```python
from app.retention import cleanup_older_than

# Delete runs and artifacts older than 30 days
cleanup_older_than(days=30)
```

## Integration with Message Bus

When publishing events to Redis/message bus, use this format:

```json
{
  "task_id": "a1b2c3d4-uuid",
  "run_id": "run-0001",
  "agent_name": "motion_generator",
  "stage": "done",
  "timestamp": "2025-01-02T14:18:00Z",
  "result_summary": {
    "frames": 180,
    "fps": 30,
    "label": "entry_peek"
  },
  "provenance": {
    "model_name": "hymotion-3b",
    "model_version": "v2025-01-01",
    "code_version": "commit-sha-abcdef"
  },
  "artifacts": [
    {"name": "motion.smpl.json", "s3_key": "motion_generator/run-0001/.../motion.smpl.json"}
  ],
  "metrics": {"confidence": 0.92}
}
```

## Best Practices

1. **Create run record BEFORE executing heavy tasks** - So UI can show queued/running status
2. **Store lightweight summaries in DB** - Keep heavy binary artifacts in S3
3. **Use immutable artifact keys** - Include run_id and UUID in S3 keys
4. **Version everything** - Model versions, prompt templates, code commit SHA
5. **Index common query fields** - agent_name, status, created_at, run_id
6. **Sanitize inputs** - Use Pydantic validation to avoid storing arbitrary large objects
7. **Export to Parquet** - For offline ML or model evaluation
8. **Retention policy** - Purge artifacts and DB rows older than X days for cost control
9. **Security** - Restrict S3 bucket access, sign URLs, secure DB and Redis

## Dependencies

See `requirements.txt` for full list. Key dependencies:
- `fastapi` - API framework
- `sqlalchemy` - ORM
- `boto3` - S3 storage
- `pandas` + `pyarrow` - Dataset export
- `pydantic` - Validation


