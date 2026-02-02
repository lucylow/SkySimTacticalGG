# Backend Integration Guide

## Overview

This backend implements a multi-agent system for tactical motion synthesis, following the architecture outlined in `ASSISTANT_COACH_ARCHITECTURE.md` and `docs/TACTICAL_MOTION_SYNTHESIS.md`.

## Architecture Flow

```
Frontend (React)
    ↓ POST /api/v1/agents/analyze-round
FastAPI (main.py)
    ↓ Enqueue Celery Task
Celery Worker (tasks.py)
    ↓ Orchestrate
Orchestrator Agent (orchestrator.py)
    ↓
    ├─→ Micro Detector (micro_detector.py)
    │   └─→ Detects predictable patterns, positioning issues
    │
    ├─→ Prompt Generator (prompt_generator.py)
    │   └─→ Converts analysis to HY-Motion prompt
    │
    ├─→ Motion Generator (motion_generator.py)
    │   └─→ Calls HY-Motion API (hy_motion_client.py)
    │
    └─→ Validator (validator.py)
        └─→ Validates motion quality
    ↓
Message Bus (message_bus.py)
    ↓ WebSocket
Frontend receives updates
    ↓ Fetch motion frames
MotionViewer renders 3D animation
```

## Key Components

### 1. FastAPI Application (`app/main.py`)
- REST API endpoints for triggering workflows
- WebSocket endpoint for real-time updates
- CORS middleware for frontend integration

### 2. Celery Tasks (`app/tasks.py`)
- Async task processing
- Redis-backed queue
- Task tracking and status

### 3. Orchestrator Agent (`app/agents/orchestrator.py`)
- Coordinates all agent stages
- Publishes progress updates
- Handles errors and retries

### 4. Micro Detector (`app/agents/micro_detector.py`)
- Analyzes GRID snapshots for patterns
- Detects predictable peek timing
- Identifies positioning and utility issues
- Uses heuristics from architecture doc

### 5. Prompt Generator (`app/agents/prompt_generator.py`)
- Builds scene descriptors
- Maps agent types to motion styles
- Generates HY-Motion prompts
- Uses motion vocabulary from tactical doc

### 6. Motion Generator (`app/agents/motion_generator.py`)
- Calls HY-Motion API
- Handles errors and fallbacks
- Returns SMPL-format motion data

### 7. Validator (`app/utils/validator.py`)
- Validates motion completeness
- Checks frame rate consistency
- Computes confidence scores
- Generates warnings

### 8. Message Bus (`app/utils/message_bus.py`)
- Pub/sub for agent updates
- Redis-backed (optional)
- WebSocket integration

### 9. HY-Motion Client (`app/utils/hy_motion_client.py`)
- HTTP client for HY-Motion API
- Mock data fallback for development
- Error handling and retries

## Data Flow Example

### Request
```json
POST /api/v1/agents/analyze-round
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
        "position": {"x": 0, "y": 0, "z": 0},
        "is_crouching": false,
        "is_moving": true,
        "peek_events": [{"time": 2.5}, {"time": 3.1}]
      }
    ],
    "round_time_remaining": 45
  }
}
```

### Response
```json
{
  "job_id": "abc-123-def",
  "status": "queued"
}
```

### WebSocket Updates
```json
// Stage 1: Micro Analysis
{
  "task_id": "abc-123-def",
  "status": "processing",
  "stage": "micro_done",
  "micro": {
    "summary": {
      "total_players": 1,
      "high_severity_count": 1,
      "average_severity": 0.6
    }
  }
}

// Stage 2: Prompt Generated
{
  "task_id": "abc-123-def",
  "status": "processing",
  "stage": "prompt_generated",
  "prompt_preview": "A Jett agent, moving in a light, acrobatic..."
}

// Stage 3: Motion Generated
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

// Stage 4: Validated
{
  "task_id": "abc-123-def",
  "status": "processing",
  "stage": "validated",
  "confidence": 0.85,
  "is_valid": true
}

// Stage 5: Completed
{
  "task_id": "abc-123-def",
  "status": "completed",
  "stage": "done",
  "motion_url": "motion://match_123_5_abc-123-def.json",
  "confidence": 0.85
}
```

## Frontend Integration

### Using MotionPanel Component

```tsx
import { MotionPanel } from '@/components/motion/MotionPanel';

function MyComponent() {
  return (
    <MotionPanel
      matchId="match_123"
      round={5}
      gridSnapshot={{
        players: [/* ... */],
        round_time_remaining: 45
      }}
      roundMeta={{
        round_phase: "mid_round",
        spike_state: "not_planted"
      }}
    />
  );
}
```

The component:
1. Submits analysis request to backend
2. Opens WebSocket connection
3. Receives real-time progress updates
4. Fetches motion data when ready
5. Renders in MotionViewer (Three.js)

## Configuration

### Agent Configuration (`config/agents.yaml`)
- Thresholds for pattern detection
- Timeouts and concurrency limits
- Monitoring settings

### Environment Variables (`.env`)
- `HY_MOTION_URL`: HY-Motion API endpoint
- `CELERY_BROKER_URL`: Redis broker
- `CORS_ORIGINS`: Allowed frontend origins

## Extending the System

### Adding New Agents

1. Create agent module in `app/agents/`
2. Implement agent logic
3. Add to orchestrator workflow
4. Publish updates via message bus

### Custom HY-Motion Integration

1. Update `hy_motion_client.py` with your API format
2. Adjust prompt format in `prompt_generator.py`
3. Map response format in `motion_generator.py`

### Adding Storage

1. Implement S3 upload in `orchestrator.py`
2. Store motion URL in database
3. Update frontend to fetch from storage

## Monitoring

### Flower Dashboard
- View active tasks
- Monitor worker performance
- Check task history

### API Health
- `GET /health`: Service health
- `GET /`: API info

### Logs
- Celery worker logs: `docker-compose logs celery-worker`
- API logs: `docker-compose logs api`

## Performance Considerations

- **Concurrency**: Adjust Celery worker concurrency in `docker-compose.yml`
- **Queue Routing**: Use separate queues for different task types
- **Caching**: Cache prompt templates and agent configs
- **Batch Processing**: Process multiple rounds in parallel

## Security

- Validate all input data
- Rate limit API endpoints
- Secure WebSocket connections (WSS in production)
- Authenticate API requests
- Sanitize user-provided data

## Testing

### Unit Tests
```bash
pytest tests/
```

### Integration Tests
```bash
pytest tests/integration/
```

### Manual Testing
1. Start services: `docker-compose up`
2. Submit test request (see QUICKSTART.md)
3. Monitor Flower dashboard
4. Check WebSocket updates

## Troubleshooting

### Tasks Not Processing
- Check Redis connection
- Verify Celery worker is running
- Check worker logs for errors

### WebSocket Disconnects
- Check CORS settings
- Verify WebSocket URL format
- Check network connectivity

### Motion Generation Fails
- Verify HY_MOTION_URL is set
- Check API response format
- Review motion generator logs

## Next Steps

1. **Production Deployment**
   - Use production Redis/PostgreSQL
   - Set up monitoring (Prometheus/Grafana)
   - Configure SSL/TLS
   - Add authentication

2. **Performance Optimization**
   - Add caching layer
   - Optimize database queries
   - Scale Celery workers
   - Use CDN for motion storage

3. **Feature Enhancements**
   - ML-based prediction models
   - Real-time streaming analysis
   - Multi-player coordination
   - Advanced motion blending


