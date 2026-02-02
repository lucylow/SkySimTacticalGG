# Quick Start: Platform Expansion Features

## 🚀 5-Minute Setup

### 1. Start Observability (Grafana + Prometheus)
```bash
cd backend
docker-compose -f docker-compose.observability.yml up -d
```
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

### 2. Start Backend
```bash
cd backend
uvicorn app.api:app --reload --port 8000
```
- API: http://localhost:8000
- Metrics: http://localhost:8000/metrics
- WebSocket: ws://localhost:8000/ws/replay

### 3. Open 3D Viewer
```bash
# Option 1: Direct file
open public/viewer/index.html

# Option 2: Serve via Python
cd public/viewer
python -m http.server 8080
# Then open http://localhost:8080/index.html
```

## 📊 Using Grafana Dashboards

1. Login to Grafana (admin/admin)
2. Navigate to Dashboards
3. Three dashboards available:
   - **Live Match Overview**: Events/sec, kills, economy
   - **AI Agent Trust & Review**: Signal rates, approval rates
   - **Replay & Audit**: Replay throughput, WebSocket connections

## 🎮 Using 3D Viewer

### Controls
- **Timeline Scrubber**: Drag to seek through replay
- **Play/Pause**: Toggle playback
- **Reset**: Return to start
- **Mode Buttons**: Switch between Viewer/Analyst/Coach modes

### Features
- **Live Replay**: Connects to WebSocket automatically
- **Trajectories**: Yellow lines show player movement
- **Heatmaps**: GPU-accelerated kill/movement density (Analyst mode)
- **Camera AI**: Automatically switches cameras based on action
- **AI Insights**: Overlay shows agent signals

## 🤖 Using ML Features

### Train Model
```bash
cd backend/notebooks
jupyter notebook
# Open 01_features.ipynb → 02_train.ipynb → 03_eval.ipynb
```

### Use in Code
```python
from app.ml.features import OnlineFeatureExtractor
from app.agents.ml.momentum_agent import momentum_agent

extractor = OnlineFeatureExtractor()
extractor.update(event)
features = extractor.snapshot("teamA")
signal = momentum_agent.infer(features)
```

## 📝 Generate Narrative
```bash
curl -X POST http://localhost:8000/api/v1/narrative \
  -H "Content-Type: application/json" \
  -d '{
    "events": [...],
    "insights": [...],
    "tone": "analyst",
    "length": "short"
  }'
```

## 🔀 Counterfactual Replays
```python
from app.counterfactual import counterfactual_engine

# Fork at round 10, change action
forked = counterfactual_engine.fork_events(
    events,
    fork_index=10,
    modification_fn=lambda e: {**e, "action": "ROTATE_B"}
)

# Compare outcomes
comparison = counterfactual_engine.compare(original, forked)
```

## 🔒 Signal Gating

Signals are automatically gated with:
- 120s minimum delay
- Requires human review
- Analysis-only labels

Configure in `app/signal_gating.py`.

## 🎯 Integration

Use the integration service to process events through the full pipeline:

```python
from app.integration import integration_service

await integration_service.process_event(canonical_event)
```

This automatically:
1. Records metrics
2. Updates features
3. Runs ML agents
4. Gates signals
5. Broadcasts to viewers

## 📁 Key Files

- **Metrics**: `backend/app/metrics.py`
- **WebSocket**: `backend/app/ws_replay.py`
- **3D Viewer**: `public/viewer/`
- **ML Features**: `backend/app/ml/features.py`
- **ML Agent**: `backend/app/agents/ml/momentum_agent.py`
- **Narrative**: `backend/app/narrative.py`
- **Gating**: `backend/app/signal_gating.py`
- **Counterfactual**: `backend/app/counterfactual.py`
- **Integration**: `backend/app/integration.py`

## 🐛 Troubleshooting

### Grafana not showing data
- Check Prometheus is scraping: http://localhost:9090/targets
- Verify metrics endpoint: http://localhost:8000/metrics

### 3D Viewer not connecting
- Check WebSocket URL in `public/viewer/ws.js`
- Verify backend is running on port 8000
- Check browser console for errors

### ML model not found
- System falls back to rule-based agents automatically
- Train model using notebooks if needed

## 📚 Full Documentation

See `backend/PLATFORM_EXPANSION.md` for detailed architecture and implementation notes.


