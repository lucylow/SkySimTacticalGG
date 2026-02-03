# Quick Start Guide

## Prerequisites
- Docker & Docker Compose installed
- Python 3.11+ (for local development, optional)

## Start the Backend (Docker Compose)

```bash
cd backend
docker-compose up --build
```

This will start:
- **API Server**: http://localhost:8000
- **Flower (Celery Monitor)**: http://localhost:5555
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

## Test the API

### 1. Health Check
```bash
curl http://localhost:8000/health
```

### 2. Start Analysis Workflow
```bash
curl -X POST http://localhost:8000/api/v1/agents/analyze-round \
  -H "Content-Type: application/json" \
  -d '{
    "match_id": "test_match_1",
    "round": 5,
    "grid_snapshot": {
      "players": [
        {
          "id": "player_1",
          "agent": "Jett",
          "role": "entry",
          "health": 100,
          "position": {"x": 0, "y": 0, "z": 0},
          "is_crouching": false,
          "is_moving": true,
          "peek_events": [{"time": 2.5}, {"time": 3.1}, {"time": 3.2}]
        }
      ],
      "round_time_remaining": 45
    },
    "round_meta": {
      "round_phase": "mid_round",
      "spike_state": "not_planted"
    }
  }'
```

Response:
```json
{
  "job_id": "abc-123-def",
  "status": "queued",
  "message": "Analysis workflow started. Connect to /ws/agents to receive updates."
}
```

### 3. Check Job Status
```bash
curl http://localhost:8000/api/v1/agents/status/{job_id}
```

### 4. Connect via WebSocket (using wscat or similar)
```bash
# Install wscat: npm install -g wscat
wscat -c ws://localhost:8000/ws/agents
```

You'll receive real-time updates like:
```json
{
  "task_id": "abc-123-def",
  "status": "processing",
  "stage": "micro_done",
  "micro": {
    "summary": {...},
    "character_count": 1
  }
}
```

## Frontend Integration

In your React app, use the `MotionPanel` component:

```tsx
import { MotionPanel } from '@/components/motion/MotionPanel';

<MotionPanel
  matchId="match_123"
  round={5}
  gridSnapshot={{
    players: [
      {
        id: "player_1",
        agent: "Jett",
        role: "entry",
        health: 100,
        position: { x: 0, y: 0, z: 0 },
        is_crouching: false,
        is_moving: true,
        peek_events: [{ time: 2.5 }, { time: 3.1 }]
      }
    ],
    round_time_remaining: 45
  }}
  roundMeta={{
    round_phase: "mid_round",
    spike_state: "not_planted"
  }}
/>
```

## Local Development (Without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Start Redis (required)
docker run -d -p 6379:6379 redis:7-alpine

# Start Celery worker (in separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info

# Start FastAPI server
uvicorn app.main:app --reload
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
HY_MOTION_URL=https://api.hymotion.example/generate
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Troubleshooting

### Celery worker not processing tasks
- Check Redis is running: `docker ps | grep redis`
- Check worker logs: `docker-compose logs celery-worker`

### WebSocket not connecting
- Check CORS settings in `.env`
- Verify WebSocket URL matches your frontend origin

### HY-Motion returns Sample data
- Set `HY_MOTION_URL` to your actual HY-Motion API endpoint
- Or use Sample data for development (default behavior)

## Next Steps

1. **Connect Real HY-Motion API**: Update `HY_MOTION_URL` in `.env`
2. **Add S3 Storage**: Implement motion frame storage in `orchestrator.py`
3. **Scale Workers**: Add more Celery workers in `docker-compose.yml`
4. **Add Monitoring**: Set up Prometheus + Grafana for metrics



