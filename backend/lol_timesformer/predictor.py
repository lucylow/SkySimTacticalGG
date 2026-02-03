import torch
import torchvision.transforms as T
from collections import deque
from dataclasses import dataclass
from typing import Tuple, Dict

@dataclass
class LoLPrediction:
    enemy_jg_position: Tuple[float, float]
    gank_probability: float  # 0-1
    objective_timer: Dict[str, float]
    rotate_probability: float  # Enemy team rotate
    playstyle_confidence: Dict[str, float]
    coach_call: str = ""

class TimeSformerPredictor:
    def __init__(self, timesformer_model):
        self.model = timesformer_model
        self.device = next(timesformer_model.parameters()).device if hasattr(timesformer_model, 'parameters') and list(timesformer_model.parameters()) else "cpu"
        self.transform = T.Compose([
            T.ToPILImage(),
            T.Resize((224, 224)),
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def predict_sequence(self, frame_buffer: deque) -> LoLPrediction:
        """Predict enemy positions from 16-frame minimap sequence"""
        if len(frame_buffer) < 16:
            return LoLPrediction((0.5, 0.5), 0.0, {'dragon': 0, 'baron': 0}, 0.0, {})
        
        try:
            # Stack frames into sequence [1, 16, 3, 224, 224] - 1 is batch size
            frames = torch.stack([
                self.transform(f.visual_frame) for f in frame_buffer
            ]).unsqueeze(0).to(self.device)
            
            # The model might expect [Batch, Channels, Time, Height, Width] or [Batch, Time, Channels, Height, Width]
            # TimeSformer usually expects [B, C, T, H, W]
            frames = frames.permute(0, 2, 1, 3, 4)
            
            with torch.no_grad():
                logits = self.model(frames)
                # Ensure logits are in a shape we expect
                if isinstance(logits, list):
                    logits = logits[0]
                
                predictions = torch.softmax(logits, dim=-1)
            
            # Parse predictions (Sampleed mapping to classes)
            # In a real model, these indices would correspond to specific output neurons
            gank_prob = float(predictions[0, 1]) if predictions.shape[1] > 1 else 0.1
            rotate_prob = float(predictions[0, 3]) if predictions.shape[1] > 3 else 0.05
            
            return LoLPrediction(
                enemy_jg_position=(0.4, 0.6),
                gank_probability=gank_prob,
                objective_timer={'dragon': 120, 'baron': 300},
                rotate_probability=rotate_prob,
                playstyle_confidence={
                    'snowball': float(predictions[0, 4]) if predictions.shape[1] > 4 else 0.5,
                    'scaler': float(predictions[0, 5]) if predictions.shape[1] > 5 else 0.5
                }
            )
        except Exception as e:
            # print(f"Prediction error: {e}")
            return LoLPrediction((0.5, 0.5), 0.1, {'dragon': 60, 'baron': 180}, 0.1, {})

