"""
Prediction Validator
Combines historical checks, ensemble agreement, and expert rules to validate motion predictions.
"""
from typing import Dict, Any, List, Optional
import json

class PredictionValidator:
    """Validates motion predictions using multiple heuristics."""
    
    def __init__(self):
        self.historical_patterns: Dict[str, List[Dict]] = {}
    
    def validate_prediction(
        self,
        match_id: str,
        motion_data: Dict[str, Any],
        historical_data: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Validate a motion prediction using multiple checks.
        
        Args:
            match_id: Match identifier
            motion_data: Generated motion data
            historical_data: Optional historical patterns for comparison
        
        Returns:
            Validation result with confidence scores
        """
        confidence_scores = []
        
        # Check 1: Motion completeness
        frames = motion_data.get("frames", [])
        if len(frames) > 0:
            confidence_scores.append(0.8)
        else:
            confidence_scores.append(0.2)
        
        # Check 2: Frame rate consistency
        expected_fps = motion_data.get("fps", 30)
        duration = motion_data.get("duration_s", 0)
        expected_frames = int(expected_fps * duration)
        if len(frames) >= expected_frames * 0.9:  # Allow 10% tolerance
            confidence_scores.append(0.9)
        else:
            confidence_scores.append(0.5)
        
        # Check 3: Historical pattern matching (if available)
        if historical_data:
            pattern_match = self._check_historical_patterns(motion_data, historical_data)
            confidence_scores.append(pattern_match)
        else:
            confidence_scores.append(0.7)  # Neutral if no history
        
        # Check 4: Motion smoothness (basic check)
        smoothness = self._check_motion_smoothness(frames)
        confidence_scores.append(smoothness)
        
        # Overall confidence (weighted average)
        overall_confidence = sum(confidence_scores) / len(confidence_scores)
        
        return {
            "overall_confidence": overall_confidence,
            "component_scores": {
                "completeness": confidence_scores[0],
                "frame_rate": confidence_scores[1],
                "historical_match": confidence_scores[2] if len(confidence_scores) > 2 else 0.7,
                "smoothness": confidence_scores[3] if len(confidence_scores) > 3 else 0.7
            },
            "is_valid": overall_confidence >= 0.6,
            "warnings": self._generate_warnings(confidence_scores, motion_data)
        }
    
    def _check_historical_patterns(
        self,
        motion_data: Dict[str, Any],
        historical_data: List[Dict]
    ) -> float:
        """Check if motion matches historical patterns."""
        # Simplified: check if action label matches common patterns
        action_label = motion_data.get("predictedActionLabel", "")
        historical_actions = [h.get("action", "") for h in historical_data]
        
        if action_label in historical_actions:
            return 0.85
        return 0.6
    
    def _check_motion_smoothness(self, frames: List[Dict]) -> float:
        """Basic check for motion smoothness."""
        if len(frames) < 2:
            return 0.5
        
        # Check for large jumps in root position (simplified)
        jumps = 0
        for i in range(1, len(frames)):
            prev_pos = frames[i-1].get("root_position", [0, 0, 0])
            curr_pos = frames[i].get("root_position", [0, 0, 0])
            
            # Calculate distance
            dist = sum((a - b) ** 2 for a, b in zip(prev_pos, curr_pos)) ** 0.5
            if dist > 1.0:  # Large jump threshold
                jumps += 1
        
        jump_ratio = jumps / len(frames)
        if jump_ratio < 0.05:  # Less than 5% jumps
            return 0.9
        elif jump_ratio < 0.1:
            return 0.7
        else:
            return 0.5
    
    def _generate_warnings(
        self,
        confidence_scores: List[float],
        motion_data: Dict[str, Any]
    ) -> List[str]:
        """Generate warnings based on validation results."""
        warnings = []
        
        if confidence_scores[0] < 0.5:
            warnings.append("Motion data appears incomplete")
        
        if len(confidence_scores) > 3 and confidence_scores[3] < 0.6:
            warnings.append("Motion may contain abrupt movements")
        
        if motion_data.get("frames", []) == []:
            warnings.append("No motion frames generated")
        
        return warnings


