# Valorant AI Assistant Coach — Implementation Package

This repository contains a complete implementation package for a Valorant AI Assistant Coach application, including mock data generation, feature extraction, ML model training, and explainability tools.

## Overview

This package provides three core deliverables:

1. **Mock Dataset Generator** — Creates realistic Valorant match data for demos and testing
2. **ML Pipeline** — Feature extraction, model training, and SHAP-based explainability
3. **Demo Insight Cards** — Ready-to-use UI components with evidence and recommendations

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Generate Mock Dataset

```bash
python generate_mock_valorant_dataset.py
```

This creates `mock_valorant_rounds.jsonl` with 100 rounds of match data for 10 players.

### 3. Extract Features

```bash
python extract_features.py
```

This processes the JSONL file and creates `features.csv` with per-player-per-round features.

### 4. Train Model

```bash
python train_model.py
```

This trains a LightGBM binary classifier to predict player deaths and saves the model to `lgb_model.pkl`.

### 5. Generate Explanations

```bash
python explain_shap.py
```

This loads the trained model and produces SHAP-based explanations for sample predictions.

## File Structure

```
.
├── generate_mock_valorant_dataset.py  # Mock data generator
├── extract_features.py                 # Feature extraction from JSONL
├── train_model.py                      # LightGBM model training
├── explain_shap.py                     # SHAP explainability
├── insight_cards.md                    # Demo insight cards + storyboard
├── requirements.txt                    # Python dependencies
├── README.md                           # This file
├── mock_valorant_rounds.jsonl          # Generated mock data (after step 2)
├── features.csv                        # Extracted features (after step 3)
└── lgb_model.pkl                       # Trained model (after step 4)
```

## Data Schema

### Mock Dataset (JSONL)

Each line in `mock_valorant_rounds.jsonl` represents one round with:

- `match_id`: Match identifier
- `round_no`: Round number
- `map`: Map name
- `players`: List of player metadata
- `player_events`: Dictionary mapping player_id → list of events
- `round_summary`: Aggregated round statistics

### Events

Each event includes:

- `event_id`: Unique event identifier
- `player_id`: Player who performed the action
- `agent`: Agent name
- `timestamp`: Event timestamp
- `position`: 3D coordinates (x, y, z)
- `view_angle`: Camera angles (yaw, pitch)
- `event_type`: Type of event (movement, ability_cast, shoot, death, assist, trade_attempt)

### Features (CSV)

The `features.csv` file contains one row per player-round with:

- `match_id`, `round_no`, `player_id`: Identifiers
- `n_events`, `n_shoot`, `n_ability`: Event counts
- `mean_latency`: Average first-shot latency
- `late_smoke`: Binary flag for late smoke usage
- `n_deaths`, `n_trades`: Death and trade counts
- `round_total_deaths`, `round_late_smokes`: Round-level aggregates
- `label_dead`: Binary label (1 if player died this round)

## Insight Cards

See `insight_cards.md` for three ready-to-use demo insight cards:

- **Card A**: Late Smoke Timing (Controller)
- **Card B**: Peek Latency (Duelist)
- **Card C**: Rotation Spread (Team-wide)

Each card includes:

- Issue description
- Impact metrics
- Recommendations
- Confidence scores
- Evidence clips
- Action buttons

## Model Details

### Architecture

- **Algorithm**: LightGBM (Gradient Boosting)
- **Task**: Binary classification (player death prediction)
- **Features**: 8 engineered features per player-round
- **Evaluation**: AUC and accuracy on validation set

### Explainability

SHAP (SHapley Additive exPlanations) values are computed to explain model predictions. The `explain_shap.py` script:

- Loads the trained model
- Computes SHAP values for sample predictions
- Ranks features by contribution
- Generates human-readable explanations

## Next Steps

### For Development

1. **Expand Features**: Add crosshair offsets, reaction latencies, ability timing relative to entry
2. **Sequence Models**: Implement LSTM/Transformer for temporal behavior patterns
3. **Real Data Integration**: Connect to Valorant replay parsers or telemetry APIs
4. **UI Integration**: Use insight cards JSON structure to build React components

### For Production

1. **Data Pipeline**: Set up streaming ingestion (Kafka, queues)
2. **Feature Store**: Implement Redis/Postgres for real-time features
3. **Model Serving**: Deploy model via REST/gRPC API
4. **Clip Server**: Store and serve evidence video clips
5. **Coach Feedback Loop**: Track implementation and measure outcomes

## Legal & Ethical Considerations

⚠️ **Important**:

- Verify compliance with Riot Games EULA and developer policies
- Obtain player consent for live telemetry
- Anonymize player data for public use
- Never automate match-affecting actions (human-in-loop required)

## License

This is a demo/educational implementation. Check Riot Games terms of service before commercial use.

## Support

For questions or contributions, refer to the detailed 15-page plan document that accompanies this implementation.
