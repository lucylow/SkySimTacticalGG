"""
Team Impact Score (TIS) Formula & Example Calculation

The Team Impact Score quantifies how recurring individual mistakes compound into 
team-level tactical consequences. It provides a single, coachable metric that 
ties micro-behavior to macro-outcomes.

Formula:
TIS = Σ (Mistake Impact × Frequency × Tactical Amplification × Context Weight)

Where:
- Mistake Impact (MI) = Base Severity × Outcome Correlation × Round Phase Multiplier
- Frequency (F) = Instances per 90 minutes
- Tactical Amplification (TA) = 1 + (Coordination Failure Rate × 0.5) + (Cascading Mistake Rate × 0.3)
- Context Weight (CW) = Economy Factor × Score Pressure Factor × Map Control Factor

Units: Expected rounds lost per 90 minutes if behavior is not corrected.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

# ============================================================================
# SAMPLE DATA: Player "Alpha" from a 30-round match (90 minutes)
# ============================================================================

mistakes_data = [
    {
        "mistake_type": "predictable_positioning",
        "player_id": "alpha_p1",
        "instances": 8,  # Occurred 8 times in the match
        "base_severity": 0.7,  # From micro-analysis
        "outcome_correlation": 0.65,  # 65% of rounds with this mistake were lost
        "round_phases": {"early": 2, "mid": 4, "late": 2},  # Distribution
        "coordination_failure_rate": 0.5,  # 50% of instances occurred with team coordination issues
        "cascading_mistake_rate": 0.25,  # 25% triggered additional mistakes
        "context_distribution": {
            "full_buy": 3,
            "half_buy": 3,
            "force_buy": 2,
            "eco": 0
        },
        "score_pressure": {
            "even": 4,
            "down_2plus": 3,
            "up_2plus": 1
        }
    },
    {
        "mistake_type": "late_utility_timing",
        "player_id": "alpha_p1",
        "instances": 5,
        "base_severity": 0.6,
        "outcome_correlation": 0.8,  # 80% correlation with round loss
        "round_phases": {"early": 0, "mid": 2, "late": 3},
        "coordination_failure_rate": 0.6,
        "cascading_mistake_rate": 0.4,
        "context_distribution": {
            "full_buy": 2,
            "half_buy": 2,
            "force_buy": 1,
            "eco": 0
        },
        "score_pressure": {
            "even": 2,
            "down_2plus": 2,
            "up_2plus": 1
        }
    }
]

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def calculate_round_phase_multiplier(phase_distribution: Dict[str, int], total: int) -> float:
    """Calculate weighted average round phase multiplier."""
    multipliers = {"early": 0.5, "mid": 1.0, "late": 1.5, "clutch": 2.0}
    weighted_sum = sum(multipliers[phase] * count for phase, count in phase_distribution.items())
    return weighted_sum / total if total > 0 else 1.0

def calculate_economy_factor(context_dist: Dict[str, int], total: int) -> float:
    """Calculate weighted average economy factor."""
    factors = {"full_buy": 1.0, "half_buy": 1.2, "force_buy": 1.5, "eco": 0.8}
    weighted_sum = sum(factors[econ] * count for econ, count in context_dist.items())
    return weighted_sum / total if total > 0 else 1.0

def calculate_score_pressure_factor(score_dist: Dict[str, int], total: int) -> float:
    """Calculate weighted average score pressure factor."""
    factors = {"even": 1.0, "down_2plus": 1.3, "up_2plus": 0.9}
    weighted_sum = sum(factors[score] * count for score, count in score_dist.items())
    return weighted_sum / total if total > 0 else 1.0

def calculate_tactical_amplification(coord_rate: float, cascade_rate: float) -> float:
    """Calculate tactical amplification factor."""
    return 1.0 + (coord_rate * 0.5) + (cascade_rate * 0.3)

def calculate_team_impact_score(mistakes: List[Dict], match_minutes: int = 90) -> Dict:
    """
    Calculate Team Impact Score for a set of mistakes.
    
    Returns:
        Dictionary with TIS breakdown and interpretation
    """
    total_tis = 0.0
    breakdown = []
    
    for mistake in mistakes:
        # 1. Calculate Mistake Impact (MI)
        round_phase_mult = calculate_round_phase_multiplier(
            mistake['round_phases'], 
            mistake['instances']
        )
        mi = mistake['base_severity'] * mistake['outcome_correlation'] * round_phase_mult
        
        # 2. Calculate Frequency (F) - normalized to per 90 minutes
        frequency = mistake['instances'] / (match_minutes / 90)
        
        # 3. Calculate Tactical Amplification (TA)
        ta = calculate_tactical_amplification(
            mistake['coordination_failure_rate'],
            mistake['cascading_mistake_rate']
        )
        
        # 4. Calculate Context Weight (CW)
        economy_factor = calculate_economy_factor(
            mistake['context_distribution'],
            mistake['instances']
        )
        score_factor = calculate_score_pressure_factor(
            mistake['score_pressure'],
            mistake['instances']
        )
        map_control_factor = 1.0  # Simplified for example
        cw = economy_factor * score_factor * map_control_factor
        
        # 5. Calculate TIS contribution for this mistake type
        tis_contribution = mi * frequency * ta * cw
        total_tis += tis_contribution
        
        breakdown.append({
            "mistake_type": mistake['mistake_type'],
            "mistake_impact": mi,
            "frequency": frequency,
            "tactical_amplification": ta,
            "context_weight": cw,
            "tis_contribution": tis_contribution
        })
    
    # Interpretation
    if total_tis < 0.5:
        interpretation = "LOW IMPACT - Mistakes are isolated and recoverable"
    elif total_tis < 1.5:
        interpretation = "MODERATE IMPACT - Noticeable tactical weakness"
    elif total_tis < 3.0:
        interpretation = "HIGH IMPACT - Significant team-level problem"
    else:
        interpretation = "CRITICAL IMPACT - Major tactical vulnerability requiring immediate attention"
    
    return {
        "total_tis": total_tis,
        "interpretation": interpretation,
        "expected_rounds_lost_per_match": total_tis * (match_minutes / 90),
        "breakdown": breakdown
    }

# ============================================================================
# EXAMPLE CALCULATION
# ============================================================================

if __name__ == "__main__":
    print("=" * 80)
    print("TEAM IMPACT SCORE (TIS) CALCULATION - EXAMPLE")
    print("=" * 80)
    print()
    
    match_minutes = 90  # Standard match length
    results = calculate_team_impact_score(mistakes_data, match_minutes)
    
    # Print detailed breakdown
    for i, mistake in enumerate(mistakes_data, 1):
        breakdown = results['breakdown'][i-1]
        print(f"Mistake Type {i}: {mistake['mistake_type']}")
        print(f"Player: {mistake['player_id']}")
        print(f"Instances: {mistake['instances']}")
        print()
        print(f"  Base Severity: {mistake['base_severity']}")
        print(f"  Outcome Correlation: {mistake['outcome_correlation']}")
        round_phase_mult = calculate_round_phase_multiplier(
            mistake['round_phases'], 
            mistake['instances']
        )
        print(f"  Round Phase Multiplier: {round_phase_mult:.2f}")
        print(f"  → Mistake Impact (MI): {breakdown['mistake_impact']:.3f}")
        print()
        print(f"  → Frequency (F): {breakdown['frequency']:.2f} per 90 minutes")
        print()
        print(f"  Coordination Failure Rate: {mistake['coordination_failure_rate']}")
        print(f"  Cascading Mistake Rate: {mistake['cascading_mistake_rate']}")
        print(f"  → Tactical Amplification (TA): {breakdown['tactical_amplification']:.3f}")
        print()
        economy_factor = calculate_economy_factor(
            mistake['context_distribution'],
            mistake['instances']
        )
        score_factor = calculate_score_pressure_factor(
            mistake['score_pressure'],
            mistake['instances']
        )
        print(f"  Economy Factor: {economy_factor:.3f}")
        print(f"  Score Pressure Factor: {score_factor:.3f}")
        print(f"  Map Control Factor: 1.000")
        print(f"  → Context Weight (CW): {breakdown['context_weight']:.3f}")
        print()
        print(f"  TIS Contribution = MI × F × TA × CW")
        print(f"                   = {breakdown['mistake_impact']:.3f} × {breakdown['frequency']:.2f} × {breakdown['tactical_amplification']:.3f} × {breakdown['context_weight']:.3f}")
        print(f"                   = {breakdown['tis_contribution']:.3f} rounds lost per 90 minutes")
        print()
        print("-" * 80)
        print()
    
    # Final result
    print("=" * 80)
    print("FINAL TEAM IMPACT SCORE")
    print("=" * 80)
    print(f"Total TIS: {results['total_tis']:.3f} rounds lost per 90 minutes")
    print()
    print(f"Interpretation: {results['interpretation']}")
    print()
    print(f"Expected rounds lost per match (90 min): {results['expected_rounds_lost_per_match']:.2f}")
    print()
    
    # Business value translation
    print("=" * 80)
    print("BUSINESS VALUE TRANSLATION")
    print("=" * 80)
    expected_rounds = results['expected_rounds_lost_per_match']
    print(f"If corrected, this player's mistakes could save approximately:")
    print(f"  • {expected_rounds:.1f} rounds per match")
    print(f"  • {expected_rounds * 0.1:.2f} expected wins per 10 matches (assuming ~10% round-to-win conversion)")
    print(f"  • Significant improvement in team coordination and tactical execution")
    print()
    
    # Actionable insight
    print("=" * 80)
    print("ACTIONABLE INSIGHT")
    print("=" * 80)
    print("Priority Focus Areas:")
    for i, (mistake, breakdown) in enumerate(zip(mistakes_data, results['breakdown']), 1):
        round_phase_mult = calculate_round_phase_multiplier(mistake['round_phases'], mistake['instances'])
        print(f"{i}. {mistake['mistake_type']}: {breakdown['tis_contribution']:.3f} rounds/90min")
        print(f"   → Focus on {'late-round' if round_phase_mult > 1.2 else 'mid-round'} execution")
        print(f"   → Address coordination in {int(mistake['coordination_failure_rate']*100)}% of instances")
    print()

