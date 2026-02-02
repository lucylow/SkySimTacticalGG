# scripts/train_intent_model.py
"""
Training script for intent prediction model.
This creates a simple RandomForestClassifier trained on synthetic/example data.
In production, replace with real labeled data from GRID matches.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
from pathlib import Path

# Feature keys (must match app/intent_model.py)
FEATURE_KEYS = ["n_events", "speed_mean", "speed_max", "kills_last_window", 
                "deaths_last_window", "abilities_used", "nearby_enemies_max", "approach_velocity"]

# Intent labels
INTENTS = ["advance", "retreat", "hold", "peek", "plant", "defuse", "rotate", "trade", "engage"]

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic training data. Replace with real labeled data."""
    np.random.seed(42)
    X = []
    y = []
    
    for _ in range(n_samples):
        # Generate features
        features = {
            "n_events": np.random.randint(1, 20),
            "speed_mean": np.random.uniform(0, 5),
            "speed_max": np.random.uniform(0, 8),
            "kills_last_window": np.random.randint(0, 3),
            "deaths_last_window": np.random.randint(0, 2),
            "abilities_used": np.random.randint(0, 5),
            "nearby_enemies_max": np.random.randint(0, 5),
            "approach_velocity": np.random.uniform(-0.1, 0.1)
        }
        
        # Simple heuristic to assign label
        if features["approach_velocity"] > 0.05 and features["speed_mean"] > 1.0:
            label = "advance"
        elif features["speed_max"] > 4 and features["kills_last_window"] > 0:
            label = "engage"
        elif features["nearby_enemies_max"] >= 2 and features["speed_mean"] < 1:
            label = "hold"
        elif features["abilities_used"] >= 2:
            label = "plant"
        else:
            label = np.random.choice(INTENTS)
        
        # Convert to vector
        vec = [float(features.get(k, 0) or 0.0) for k in FEATURE_KEYS]
        X.append(vec)
        y.append(label)
    
    return np.array(X), np.array(y)

def main():
    print("Training intent prediction model...")
    
    # Generate or load training data
    # TODO: Replace with real labeled data from GRID matches
    X, y = generate_synthetic_data(n_samples=2000)
    
    # Encode labels
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    label_map = {i: label for i, label in enumerate(le.classes_)}
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    # Train
    print(f"Training on {len(X_train)} samples...")
    clf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        random_state=42,
        n_jobs=-1
    )
    clf.fit(X_train, y_train)
    
    # Evaluate
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nTest Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=le.classes_))
    
    # Save model
    model_dir = Path(__file__).parent.parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / "intent_model.joblib"
    
    model_bundle = {
        "clf": clf,
        "label_map": label_map
    }
    joblib.dump(model_bundle, model_path)
    print(f"\nModel saved to {model_path}")

if __name__ == "__main__":
    main()

