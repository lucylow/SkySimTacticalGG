# SkySim Tactical GG Backend

Multi-agent system for tactical motion synthesis using FastAPI, Celery, and HY-Motion.

## Architecture

```
User Request → FastAPI → Celery Task → Orchestrator
                                        ↓
                    Micro Detector → Prompt Generator → Motion Generator → Validator
                                        ↓
                                    HY-Motion API
                                        ↓
                                    Message Bus → WebSocket → Frontend
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)

### Using Docker Compose (Recommended)

```bash
cd backend
docker-compose up --build
```

This starts:

- **API**: FastAPI server on `http://localhost:8000`
- **Celery Worker**: Background task processor
- **Flower**: Celery monitoring on `http://localhost:5555`
- **Redis**: Message broker and result backend
- **PostgreSQL**: Database (optional)

### Local Development

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

## Open Source Esports Data Integration

The platform now supports open source esports data sources on top of GRID:

- **Riot Games API**: League of Legends, Valorant, Teamfight Tactics
- **OpenDota API**: Dota 2 match data and statistics
- **Liquipedia API**: Tournament data and match history

See [docs/OPENSOURCE_ESPORTS_INTEGRATION.md](../docs/OPENSOURCE_ESPORTS_INTEGRATION.md) for full documentation.

### Quick Start with Open Source Data

```bash
# Set API keys in .env
RIOT_API_KEY=your_key_here
OPENSOURCE_ENABLED=true

# Start unified ingestion (GRID + open source)
python -m app.unified_ingest
```

### Open Source API Endpoints

- `GET /api/opensource/live-matches` - Get live matches from all sources
- `GET /api/opensource/riot/live` - Get live Riot Games matches
- `GET /api/opensource/opendota/live` - Get live Dota 2 matches
- `GET /api/opensource/riot/match/{match_id}` - Get Riot match details
- `GET /api/opensource/opendota/match/{match_id}` - Get OpenDota match details
- `POST /api/opensource/backfill` - Backfill matches from specific source

## API Endpoints

### POST `/api/v1/agents/analyze-round`

Kick off multi-agent workflow for a match/round.

**Request:**

```json
{
  "match_id": "match_123",
  "round": 5,
  "grid_snapshot": {
    "players": [
      {
        "id": "player_1",
        "agent": "Jett",
        "role": "entry",
        "health": 100,
        "position": { "x": 0, "y": 0, "z": 0 },
        "is_crouching": false,
        "is_moving": true,
        "peek_events": [{ "time": 2.5 }, { "time": 3.1 }]
      }
    ],
    "round_time_remaining": 45
  },
  "round_meta": {
    "round_phase": "mid_round",
    "spike_state": "not_planted"
  },
  "duration_s": 6
}
```

**Response:**

```json
{
  "job_id": "abc-123-def",
  "status": "queued",
  "message": "Analysis workflow started. Connect to /ws/agents to receive updates."
}
```

### GET `/api/v1/agents/status/{job_id}`

Get job status (synchronous check).

### WebSocket `/ws/agents`

Real-time updates for agent workflow progress.

**Message Format:**

```json
{
  "task_id": "abc-123-def",
  "status": "processing",
  "stage": "motion_generated",
  "motion_meta": {
    "frames": 180,
    "duration_s": 6,
    "fps": 30
  }
}
```

## Agent Workflow

1. **Micro Detector**: Analyzes grid snapshot for predictable patterns, positioning issues
2. **Prompt Generator**: Converts analysis into HY-Motion prompt using motion vocabulary
3. **Motion Generator**: Calls HY-Motion API to generate motion sequence
4. **Validator**: Validates motion quality and confidence
5. **Orchestrator**: Coordinates all stages and publishes progress updates

## Configuration

Edit `config/agents.yaml` to adjust agent thresholds, timeouts, and behavior.

## Environment Variables

See `.env.example` for all available options. Key variables:

- `HY_MOTION_URL`: HY-Motion API endpoint (or Sample for development)
- `CELERY_BROKER_URL`: Redis broker URL
- `CORS_ORIGINS`: Allowed CORS origins
- `RIOT_API_KEY`: Riot Games API key (optional, for League of Legends/Valorant data)
- `OPENSOURCE_ENABLED`: Enable/disable open source data sources (default: true)
- `OPENSOURCE_POLL_INTERVAL`: Seconds between open source API polls (default: 60)

## Monitoring

- **Flower**: `http://localhost:5555` - Celery task monitoring
- **API Docs**: `http://localhost:8000/docs` - FastAPI Swagger UI
- **Health Check**: `http://localhost:8000/health`

## Development Notes

- For hackathon MVP, HY-Motion client returns Sample data if URL is not set
- Message bus uses in-memory pub/sub by default (set `USE_REDIS_PUBSUB=true` for Redis)
- All agent logic uses heuristics from the architecture doc
- Motion frames are returned in SMPL format (24 joints, quaternion rotations)

## Next Steps

1. Integrate with actual HY-Motion API (local or remote)
2. Add S3 storage for motion frames
3. Implement Three.js frontend component (see frontend integration)
4. Add ML-based prediction models (replace heuristics)
5. Scale with multiple Celery workers

