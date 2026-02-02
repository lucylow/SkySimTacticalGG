# AI Agents Routing & Orchestration - Quick Start

## Overview

This system provides a production-ready agent routing and orchestration framework with:
- FastAPI HTTP entrypoint + WebSocket streaming
- Celery task execution with queue affinity
- Redis for state, pub/sub, capacity counters, and idempotency
- Pluggable agent registry with capability-based routing
- Orchestrator supporting pipeline, fan-out/fan-in, speculative execution, timeouts, retries, and fallbacks

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start Redis

Using Docker:
```bash
docker run -d -p 6379:6379 redis:7
```

Or use the docker-compose setup (see below).

### 3. Start Celery Worker

```bash
celery -A app.celery_app.celery worker --loglevel=info --concurrency=4 -Q general
```

For GPU workers:
```bash
celery -A app.celery_app.celery worker --loglevel=info --concurrency=1 -Q gpu
```

### 4. Start FastAPI Server

```bash
uvicorn app.api:app --host 0.0.0.0 --port 8000
```

### 5. Run Orchestration

**Via HTTP API:**
```bash
curl -X POST http://localhost:8000/api/v1/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "match_123",
    "round": "round_4",
    "grid_snapshot": {
      "players": [
        {"id":"p1","role":"entry", "peek_events":[{"time":1}, {"time":2}, {"time":2.5}]},
        {"id":"p2","role":"support", "peek_events":[]}
      ]
    }
  }'
```

**Via Python:**
```python
from app.celery_orchestrator import run_orchestration

payload = {
    "match_id": "match_123",
    "round": "round_4",
    "grid_snapshot": {
        "players": [
            {"id":"p1","role":"entry", "peek_events":[{"time":1}, {"time":2}, {"time":2.5}]},
            {"id":"p2","role":"support", "peek_events":[]}
        ]
    }
}
result = run_orchestration.delay(payload)
```

### 6. Subscribe to Progress Events

Connect to WebSocket: `ws://localhost:8000/ws/agents`

Or subscribe to Redis channel `agents:events` directly:
```python
from app.utils.message_bus import MessageBus

bus = MessageBus()
def on_event(payload):
    print(f"Event: {payload}")

bus.subscribe(on_event)
```

## Docker Compose Setup

```bash
docker compose up --build
```

This starts:
- Redis on port 6379
- FastAPI backend on port 8000
- General worker (queue: general)
- GPU worker (queue: gpu) - requires nvidia-docker
- Flower (Celery monitoring) on port 5555

## Architecture

### Agent Registration

Agents are auto-discovered via the `@register_agent` decorator:

```python
from app.agents.base import AgentBase
from app.agents.registry import register_agent

@register_agent
class MyAgent(AgentBase):
    name = "my_agent"
    capabilities = ["my_capability"]
    priority = 10
    
    def run(self, payload):
        # Your agent logic
        return {"result": "..."}
```

### Configuration

Edit `config/agents.yaml` to configure agent capabilities, priorities, concurrency limits, and queue assignments.

### Orchestration Patterns

The system supports:
- **Pipeline**: Sequential agent execution
- **Fan-out/Fan-in**: Parallel execution with result aggregation
- **Speculative Execution**: Race between primary and backup agents (first-to-complete wins)
- **Fallbacks**: Automatic fallback to alternative agents

### Queue Affinity

Agents can be assigned to specific Celery queues (e.g., `gpu` for GPU-accelerated tasks). Configure in `config/agents.yaml`:

```yaml
agents:
  motion_generator:
    queue: "gpu"
    max_concurrency: 2
```

## Monitoring

- **Flower**: http://localhost:5555 (Celery task monitoring)
- **Health Check**: http://localhost:8000/health
- **WebSocket**: ws://localhost:8000/ws/agents (real-time progress)

## Notes

- Replace agent implementations (e.g., `motion_generator.py`) with your actual model calls
- Adjust timeouts and concurrency limits in `config/agents.yaml` based on your workload
- For production, secure Redis (password, VPC) and add authentication to FastAPI endpoints
- GPU workers require nvidia-docker/nvidia-container-toolkit


