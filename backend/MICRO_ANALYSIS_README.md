# Micro-Analysis & Motion Synthesis System

This system implements production-grade micro-analysis and motion synthesis for GRID esports events. It consumes canonical events from Redis streams, predicts player intent using hybrid heuristics + ML, and generates 3D motion animations via HY-Motion 1.0.

## Architecture

### Components

1. **Feature Window Manager** (`app/features.py`)
   - Maintains sliding windows of recent events per player
   - Computes micro-features (speed, proximity, combat signals)
   - Evaluates fast heuristic rules for intent detection

2. **Intent Model** (`app/intent_model.py`)
   - Lightweight ML model wrapper (sklearn/joblib)
   - Predicts player intent from feature vectors
   - Falls back to dummy model if no trained model exists

3. **HY-Motion Client** (`app/hy_motion_client.py`)
   - Integration layer for HY-Motion 1.0 API
   - Supports REST API and CLI fallback
   - Returns GLTF/SMPL motion artifacts

4. **Micro Analysis Agent** (`app/agents/micro_analysis.py`)
   - Main consumer orchestrator
   - Processes canonical events from Redis stream
   - Combines heuristics + ML for intent prediction
   - Triggers motion synthesis and human-in-the-loop reviews

5. **Postprocessing** (`app/postprocess.py`)
   - Motion smoothing and keyframe conversion
   - GLTF normalization (placeholder for now)

6. **Visualization Exporter** (`app/visualization_exporter.py`)
   - Generates preview thumbnails from GLTF
   - Placeholder for headless rendering

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Settings

Update `app/settings.py` or set environment variables:

```bash
export HY_MOTION_API_URL="http://localhost:8080"
export HY_MOTION_API_KEY="your-api-key"
export S3_BUCKET="agent-artifacts"
export S3_REGION="us-east-1"
```

### 3. Train Intent Model (Optional)

```bash
python scripts/train_intent_model.py
```

This creates `models/intent_model.joblib`. The system will use a dummy model if this file doesn't exist.

### 4. Start Consumer

```bash
python -m app.agents.micro_analysis
```

Or integrate into your main application:

```python
from app.agents.micro_analysis import run_consumer
asyncio.run(run_consumer())
```

## Usage

### Event Flow

1. **Canonical events** arrive at `events:canonical` Redis stream
2. **Micro Analysis Agent** consumes events and updates feature windows
3. **Heuristics** evaluate fast rules (e.g., "approach + velocity → advance")
4. **ML Model** predicts intent if heuristics are ambiguous
5. **HY-Motion** synthesizes 3D motion animation
6. **Artifacts** uploaded to S3
7. **Agent signals** published to `events:agent:motion` stream

### Intent Types

- `advance`: Moving toward objective
- `retreat`: Moving away from danger
- `hold`: Holding position
- `peek`: Quick peek/check
- `plant`: Planting objective
- `defuse`: Defusing objective
- `rotate`: Rotating to new position
- `trade`: Trading kills
- `engage`: Engaging in combat

### Human-in-the-Loop

The system automatically creates human review jobs when:
- Confidence < 0.6 (configurable via `HITL_CONF_THRESHOLD`)
- Sensitive intents detected (configurable via `is_sensitive_intent()`)
- Motion synthesis fails

Reviews are stored in the database via `app/persistence_hitl.py`.

## Testing

### Local Test

```bash
python scripts/test_micro_analysis.py
```

### Sample Event

```python
sample_event = {
    "event_id": "evt_test_1",
    "match_id": "match_demo_1",
    "event_type": "POSITION_UPDATE",
    "actor": "player:demo_p1",
    "timestamp": "2026-01-01T12:00:00Z",
    "payload": {
        "pos": [12.4, 0, 8.9],
        "objective_pos": [10.0, 0, 10.0],
        "ts": 100.0
    }
}
```

## Configuration

### Feature Window

Default window: 4.0 seconds. Adjust in `FeatureWindowManager(window_seconds=4.0)`.

### Confidence Threshold

Default: 0.6. Adjust `HITL_CONF_THRESHOLD` in `micro_analysis.py`.

### Motion Duration Mapping

Edit `map_intent_to_duration()` in `micro_analysis.py` to adjust animation lengths.

## Production Considerations

### Scaling

- **Synthesis Queuing**: Use Celery workers for HY-Motion calls (see `celery_tasks_agents.py`)
- **State Sharing**: Use Redis Hashes for per-match state across workers
- **Caching**: Cache synthesized motions by intent+feature hash

### Monitoring

Instrument metrics:
- `intents_predicted_total{intent=...}`
- `motions_generated_total`
- `motion_latency_seconds`
- `hitl_reviews_total`

### Model Updates

- Version models and store `model_version` in motion request metadata
- Keep feature vectorization deterministic (same key ordering)

### Security

- Validate HY-Motion inputs to avoid prompt injection
- Sanitize features before passing to synthesis
- Review sensitive intents before generation

## File Structure

```
backend/
├── app/
│   ├── agents/
│   │   └── micro_analysis.py      # Main consumer
│   ├── features.py                 # Feature window manager
│   ├── intent_model.py             # ML model wrapper
│   ├── hy_motion_client.py         # HY-Motion integration
│   ├── postprocess.py              # Motion postprocessing
│   ├── visualization_exporter.py  # Preview generation
│   └── storage.py                  # S3 upload utilities
├── models/
│   └── intent_model.joblib         # Trained model (after training)
└── scripts/
    ├── train_intent_model.py      # Training script
    └── test_micro_analysis.py     # Test script
```

## Next Steps

1. **Train on Real Data**: Replace synthetic data in `train_intent_model.py` with labeled GRID match data
2. **Implement Postprocessing**: Add GLTF smoothing and keyframe optimization
3. **Add Preview Rendering**: Implement headless GLTF renderer for thumbnails
4. **Celery Integration**: Queue motion synthesis tasks for async processing
5. **Metrics**: Add Prometheus instrumentation
6. **Frontend Integration**: Connect to React components for motion visualization

## Troubleshooting

### Model Not Found

The system will use a dummy model if `models/intent_model.joblib` doesn't exist. Train a model using `scripts/train_intent_model.py`.

### HY-Motion Connection Failed

Check `HY_MOTION_API_URL` and `HY_MOTION_API_KEY` settings. The system will fall back to CLI if configured.

### S3 Upload Fails

Verify `S3_BUCKET` and AWS credentials. Check `boto3` configuration.

### No Intents Detected

Ensure events have `payload.pos` and relevant fields. Check feature window size and heuristic thresholds.


