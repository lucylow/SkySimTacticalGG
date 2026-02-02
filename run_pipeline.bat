@echo off
REM run_pipeline.bat
REM Execute the complete ML pipeline: generate data → extract features → train model → explain

echo === Valorant AI Assistant Coach - ML Pipeline ===
echo.

echo Step 1/4: Generating mock dataset...
python generate_mock_valorant_dataset.py
if errorlevel 1 (
    echo Error: Failed to generate mock dataset
    exit /b 1
)
echo ✓ Generated mock_valorant_rounds.jsonl
echo.

echo Step 2/4: Extracting features...
python extract_features.py
if errorlevel 1 (
    echo Error: Failed to extract features
    exit /b 1
)
echo ✓ Generated features.csv
echo.

echo Step 3/4: Training LightGBM model...
python train_model.py
if errorlevel 1 (
    echo Error: Failed to train model
    exit /b 1
)
echo ✓ Trained and saved lgb_model.pkl
echo.

echo Step 4/4: Generating SHAP explanations...
python explain_shap.py
if errorlevel 1 (
    echo Error: Failed to generate explanations
    exit /b 1
)
echo ✓ Generated explanations
echo.

echo === Pipeline Complete ===
echo.
echo Generated files:
echo   - mock_valorant_rounds.jsonl (mock match data)
echo   - features.csv (extracted features)
echo   - lgb_model.pkl (trained model)
echo.
echo Next steps:
echo   - Review insight_cards.md for demo UI components
echo   - Use insight_cards.json for UI integration
echo   - Check README.md for detailed documentation

