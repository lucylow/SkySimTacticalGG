# app/intent_model.py
import joblib
import numpy as np
from typing import Dict, Any
from pydantic import BaseModel
import os

class IntentPrediction(BaseModel):
    intent: str
    confidence: float
    explanation: str = ""

class IntentModel:
    def __init__(self, clf, label_map):
        self.clf = clf
        self.label_map = label_map

    @classmethod
    def load(cls, path: str):
        """
        Load a trained model from disk.
        If model doesn't exist, return a dummy model that always predicts 'advance' with low confidence.
        """
        if not os.path.exists(path):
            # Return a dummy model for development
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.preprocessing import LabelEncoder
            
            # Create a minimal dummy model
            dummy_clf = RandomForestClassifier(n_estimators=10, random_state=42)
            # Train on dummy data
            X_dummy = np.random.rand(10, 8)
            y_dummy = np.array(['advance'] * 10)
            le = LabelEncoder()
            y_encoded = le.fit_transform(y_dummy)
            dummy_clf.fit(X_dummy, y_encoded)
            
            label_map = {i: label for i, label in enumerate(le.classes_)}
            return cls(dummy_clf, label_map)
        
        model_bundle = joblib.load(path)
        return cls(model_bundle["clf"], model_bundle["label_map"])

    def feature_vector(self, features: Dict[str, Any]):
        # deterministic vectorization — ensure same ordering when training
        keys = ["n_events", "speed_mean", "speed_max", "kills_last_window", "deaths_last_window", "abilities_used", "nearby_enemies_max", "approach_velocity"]
        vec = [float(features.get(k, 0) or 0.0) for k in keys]
        return np.array(vec).reshape(1, -1)

    def predict(self, features: Dict[str,Any]) -> Dict[str,Any]:
        x = self.feature_vector(features)
        probs = self.clf.predict_proba(x)[0]
        best_idx = int(np.argmax(probs))
        intent_label = self.label_map[best_idx]
        confidence = float(probs[best_idx])
        explanation = f"model_probs={dict(zip(self.label_map.values(), list(probs)))}"
        return {"intent": intent_label, "confidence": confidence, "explanation": explanation}


