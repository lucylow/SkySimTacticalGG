#!/bin/bash
# run_pipeline.sh
# Execute the complete ML pipeline: generate data → extract features → train model → explain

set -e  # Exit on error

echo "=== Valorant AI Assistant Coach - ML Pipeline ==="
echo ""

echo "Step 1/4: Generating mock dataset..."
python generate_mock_valorant_dataset.py
echo "✓ Generated mock_valorant_rounds.jsonl"
echo ""

echo "Step 2/4: Extracting features..."
python extract_features.py
echo "✓ Generated features.csv"
echo ""

echo "Step 3/4: Training LightGBM model..."
python train_model.py
echo "✓ Trained and saved lgb_model.pkl"
echo ""

echo "Step 4/4: Generating SHAP explanations..."
python explain_shap.py
echo "✓ Generated explanations"
echo ""

echo "=== Pipeline Complete ==="
echo ""
echo "Generated files:"
echo "  - mock_valorant_rounds.jsonl (mock match data)"
echo "  - features.csv (extracted features)"
echo "  - lgb_model.pkl (trained model)"
echo ""
echo "Next steps:"
echo "  - Review insight_cards.md for demo UI components"
echo "  - Use insight_cards.json for UI integration"
echo "  - Check README.md for detailed documentation"

