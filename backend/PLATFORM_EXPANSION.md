# Esports Platform Expansion

This document describes the comprehensive expansion of the esports platform with Grafana observability, 3D replay viewer, ML pipelines, and advanced AI features.

## Overview

This expansion adds production-grade observability, visualization, and ML capabilities to the esports data platform:

- **Grafana Dashboards**: Real-time observability for ingestion, agents, and replay
- **3D Round Replay Viewer**: WebGL-based visualization with WebSocket live updates
- **ML Feature Extraction**: Batch and real-time feature pipelines
- **ML Inference Agents**: Trained models for momentum detection
- **LLM Narrative Generation**: Analyst-style commentary from events
- **Multi-Camera Director AI**: Broadcast-quality camera switching
- **Coach/Analyst Modes**: Specialized UI modes for different audiences
- **Counterfactual Replays**: "What-if" simulation for coaching
- **Signal Gating**: Betting-safe signal emission with delays and review

## Architecture

```
GRID Events
    │
    ▼
FastAPI Ingestion
    │
    ├─► Prometheus Metrics
    ├─► Feature Extraction (Online)
    ├─► ML Agents (Momentum, etc.)
    ├─► Signal Gating
    ├─► WebSocket Broadcast
    │       │
    │       └─► 3D Viewer (Three.js)
    │
    └─► Grafana Dashboards
```

## Components

### 1. Observability Stack

**Files:**
- `docker-compose.observability.yml` - Prometheus + Grafana services
- `config/prometheus.yml` - Prometheus scrape config
- `config/grafana/` - Dashboard definitions
- `app/metrics.py` - Prometheus instrumentation

**Dashboards:**
- Live Match Overview: Events/sec, kills, economy, latency
- AI Agent Trust & Review: Signals, approval rates, confidence
- Replay & Audit: Replay throughput, WebSocket connections, audit logs

**Start:**
```bash
docker-compose -f docker-compose.observability.yml up -d
```

Access Grafana at http://localhost:3000 (admin/admin)

### 2. 3D Replay Viewer

**Files:**
- `public/viewer/index.html` - Main viewer page
- `public/viewer/main.js` - Three.js scene setup
- `public/viewer/stateEngine.js` - Event replay engine
- `public/viewer/players.js` - Player mesh management
- `public/viewer/map.js` - Map geometry
- `public/viewer/cameraAI.js` - Camera director AI
- `public/viewer/heatmapGPU.js` - GPU-instanced heatmaps
- `public/viewer/ws.js` - WebSocket client

**Features:**
- Live WebSocket replay
- Player trajectories (yellow trails)
- GPU heatmaps (kill/movement density)
- Multi-camera director (follow/overhead/free)
- Coach/Analyst/Viewer modes
- Timeline scrubbing

**Access:**
Open `public/viewer/index.html` in browser or serve via web server.

### 3. ML Feature Extraction

**Files:**
- `app/ml/features.py` - Feature extraction classes
- `app/agents/ml/momentum_agent.py` - ML inference agent
- `notebooks/01_features.ipynb` - Batch feature extraction
- `notebooks/02_train.ipynb` - Model training
- `notebooks/03_eval.ipynb` - Model evaluation

**Usage:**
```python
from app.ml.features import FeatureExtractor, OnlineFeatureExtractor

# Batch extraction
extractor = FeatureExtractor(window_size=5)
features = extractor.extract_team_features(events, team="teamA", round_num=10)

# Real-time extraction
online = OnlineFeatureExtractor()
online.update(event)
snapshot = online.snapshot("teamA")
```

### 4. LLM Narrative Generation

**Files:**
- `app/narrative.py` - Narrative service

**API:**
```bash
POST /api/v1/narrative
{
  "events": [...],
  "insights": [...],
  "tone": "analyst",
  "length": "short"
}
```

**Environment:**
Set `OPENAI_API_KEY` for LLM generation, otherwise uses templates.

### 5. Signal Gating

**Files:**
- `app/signal_gating.py` - Signal gate middleware

**Policies:**
- Minimum delay (120s default)
- Requires human review
- Audience restrictions
- Analysis-only labels

### 6. Counterfactual Replays

**Files:**
- `app/counterfactual.py` - What-if simulation engine

**Usage:**
```python
from app.counterfactual import counterfactual_engine

# Fork timeline
forked = counterfactual_engine.fork_events(
    events,
    fork_index=10,
    modification_fn=lambda e: {**e, "action": "ROTATE_B"}
)

# Simulate
outcome = counterfactual_engine.simulate(forked)
comparison = counterfactual_engine.compare(original, forked)
```

## Integration

The `app/integration.py` service wires everything together:

```python
from app.integration import integration_service

# Process event through full pipeline
await integration_service.process_event(canonical_event)
```

This automatically:
1. Records Prometheus metrics
2. Updates feature extractors
3. Runs ML agents
4. Gates signals
5. Broadcasts to WebSocket viewers

## Demo Flow

1. Start observability stack: `docker-compose -f docker-compose.observability.yml up`
2. Start backend: `uvicorn app.api:app --reload`
3. Open 3D viewer: `public/viewer/index.html`
4. Ingest events (via GRID integration or mock)
5. Watch:
   - Grafana dashboards update in real-time
   - 3D viewer shows live replay
   - AI signals appear in viewer
   - Heatmaps build up
   - Camera switches automatically

## Environment Variables

```bash
# Optional: LLM narrative generation
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# CORS for viewer
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Next Steps

- Add more ML models (economy prediction, clutch detection)
- Enhance 3D viewer with more map detail
- Add voice-over generation synced to replay
- Multi-user collaborative review
- RL-based strategy simulation

## Notes

- The 3D viewer uses CDN Three.js for simplicity. For production, bundle locally.
- ML models are optional - system falls back to rule-based agents if models not found.
- Signal gating is always enabled for safety.
- Counterfactuals are explicitly labeled and never streamed live.


