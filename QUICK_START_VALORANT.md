# Valorant AI Assistant Coach - Quick Start Guide

## ✅ What's Been Delivered

This package includes **three complete deliverables** as requested:

### 1. Mock Dataset Generator

- **File**: `generate_mock_valorant_dataset.py`
- **Output**: `mock_valorant_rounds.jsonl` (100 rounds, 10 players)
- **Usage**: `python generate_mock_valorant_dataset.py`

### 2. ML Pipeline (Feature Extraction → Training → Explainability)

- **Feature Extraction**: `extract_features.py` → `features.csv`
- **Model Training**: `train_model.py` → `lgb_model.pkl`
- **SHAP Explanations**: `explain_shap.py` → console output with explanations

### 3. Demo Insight Cards

- **Markdown**: `insight_cards.md` (detailed cards + 45s storyboard)
- **JSON**: `insight_cards.json` (ready for UI integration)
- **Three Cards**: Late Smoke Timing, Peek Latency, Rotation Spread

## 🚀 Run Everything

### Option 1: Automated Pipeline (Recommended)

**Linux/Mac:**

```bash
chmod +x run_pipeline.sh
./run_pipeline.sh
```

**Windows:**

```cmd
run_pipeline.bat
```

### Option 2: Manual Steps

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate mock data
python generate_mock_valorant_dataset.py

# 3. Extract features
python extract_features.py

# 4. Train model
python train_model.py

# 5. Generate explanations
python explain_shap.py
```

## 📁 File Structure

```
.
├── generate_mock_valorant_dataset.py  # Mock data generator
├── extract_features.py                 # Feature extraction
├── train_model.py                      # LightGBM training
├── explain_shap.py                      # SHAP explainability
├── insight_cards.md                     # Demo cards + storyboard
├── insight_cards.json                   # JSON for UI integration
├── requirements.txt                     # Python dependencies
├── run_pipeline.sh                      # Automated pipeline (Unix)
├── run_pipeline.bat                     # Automated pipeline (Windows)
└── README.md                            # Full documentation
```

## 🎯 Next Steps

1. **Test the Pipeline**: Run `./run_pipeline.sh` to generate all outputs
2. **Review Insight Cards**: Open `insight_cards.md` for UI mockups
3. **Integrate JSON**: Use `insight_cards.json` in your React/UI components
4. **Customize Features**: Expand `extract_features.py` with richer signals
5. **Build UI**: Use the insight card structure to create coach-facing components

## 📊 Expected Outputs

After running the pipeline, you'll have:

- **mock_valorant_rounds.jsonl**: 100 rounds of synthetic match data
- **features.csv**: ~1000 rows (10 players × 100 rounds) with engineered features
- **lgb_model.pkl**: Trained LightGBM model (AUC ~0.7-0.9 on validation)
- **Console output**: SHAP explanations showing top contributing features

## 🎬 Demo Storyboard

See `insight_cards.md` for a complete 45-second video/GIF storyboard showing:

- Match overview → Round details → Insight card → Evidence clip → Practice drill creation

## 💡 Key Features

- **Deterministic**: Uses seed=42 for reproducible results
- **Realistic**: Event types, timings, and patterns match real Valorant gameplay
- **Extensible**: Easy to add new features, events, or players
- **Production-Ready**: Clean code structure, error handling, documentation

## 🔧 Customization

### Add More Events

Edit `generate_mock_valorant_dataset.py` → `sample_events_for_player()` function

### Add More Features

Edit `extract_features.py` → add new feature calculations in the loop

### Change Model

Edit `train_model.py` → modify LightGBM parameters or switch to XGBoost

### Add More Insight Cards

Edit `insight_cards.json` → add new card objects following the schema

## 📚 Full Documentation

See `README.md` for:

- Detailed data schemas
- Model architecture
- Legal/ethical considerations
- Production deployment guide

---

**Ready to go!** Run the pipeline and start building your Valorant AI Assistant Coach UI. 🎮
