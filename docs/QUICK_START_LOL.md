# League of Legends AI Assistant Coach - Quick Start Guide

## What's Included

1. Sample Dataset Generator
   - File: `generate_sample_lol_dataset.py`
   - Output: `Sample_lol_events.jsonl` (10 matches)
   - Usage: `python generate_sample_lol_dataset.py`

2. Feature Extraction
   - File: `lol_extract_features.py`
   - Output: `lol_features.csv`
   - Usage: `python lol_extract_features.py`

3. Demo Insight Cards (UI-ready)
   - JSON: `lol_insight_cards.json`

## Run Everything

Windows (PowerShell / CMD):

```cmd
python generate_sample_lol_dataset.py
python lol_extract_features.py
```

Mac/Linux:

```bash
python3 generate_sample_lol_dataset.py
python3 lol_extract_features.py
```

## Expected Outputs

- `Sample_lol_events.jsonl`: Synthetic event stream for 10 matches
- `lol_features.csv`: Per-player per-match features
- `lol_insight_cards.json`: Three coach-ready insight cards (CS under pressure, TP response, Roam payoff)

## Next Steps

- Train a simple model on `lol_features.csv` (e.g., classify low vs. high TP reaction or predict roam success). You can mirror `train_model.py` and `explain_shap.py` from Valorant.
- Integrate `lol_insight_cards.json` into your UI (use the same card component style as Valorant).
- Extend features: deaths, objective participation by player, lane-specific signals (wave state, recall timings), and pairwise synergy metrics.

