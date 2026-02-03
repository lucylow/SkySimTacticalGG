# Team Impact Score (TIS) Formula

## Overview

The **Team Impact Score (TIS)** quantifies how recurring individual mistakes compound into team-level tactical consequences. It provides a single, coachable metric that ties micro-behavior to macro-outcomes — turning raw analytics into actionable insights that coaches can immediately understand and act upon.

**Key Value Proposition**: Unlike traditional analytics that show "Player X made 8 positioning mistakes," TIS answers "If we fix Player X's positioning, how many rounds per match will we save?"

---

## Formula

### Base Formula

```
TIS = Σ (Mistake Impact × Frequency × Tactical Amplification × Context Weight)
```

**Units**: Expected rounds lost per 90 minutes (or per match) if behavior is not corrected.

### Component Breakdown

#### 1. Mistake Impact (MI)

**Formula:**

```
MI = Base Severity × Outcome Correlation × Round Phase Multiplier
```

**Components:**

- **Base Severity** (0-1): Score from micro-analysis engine
  - Positioning errors: 0.6-0.8
  - Utility timing: 0.5-0.7
  - Economy decisions: 0.4-0.6
  - Communication gaps: 0.7-0.9

- **Outcome Correlation** (0-1): Historical correlation between this mistake type and round loss
  - Calculated from: `(Rounds with mistake that were lost) / (Total rounds with mistake)`
  - Example: If 65% of rounds with "predictable positioning" were lost, correlation = 0.65

- **Round Phase Multiplier**:
  - Early round: 0.5 (recoverable, less critical)
  - Mid round: 1.0 (standard impact)
  - Late round: 1.5 (critical, high pressure)
  - Clutch (1vX): 2.0 (game-deciding)

**Example:**

- Base Severity: 0.7
- Outcome Correlation: 0.65
- Round Phase (weighted): 1.0 (mostly mid-round)
- **MI = 0.7 × 0.65 × 1.0 = 0.455**

---

#### 2. Frequency (F)

**Formula:**

```
F = (Number of instances in observation period) / (Minutes observed / 90)
```

Normalized to "per 90 minutes" for consistency across match lengths and training sessions.

**Example:**

- 8 instances in a 90-minute match
- **F = 8 / (90/90) = 8.0 per 90 minutes**

---

#### 3. Tactical Amplification (TA)

**Formula:**

```
TA = 1 + (Coordination Failure Rate × 0.5) + (Cascading Mistake Rate × 0.3)
```

**Components:**

- **Coordination Failure Rate** (0-1): % of times this mistake occurs alongside team coordination issues
  - Example: Player's positioning mistake happens during a failed execute = coordination failure
- **Cascading Mistake Rate** (0-1): % of times this mistake triggers additional mistakes from teammates
  - Example: Player's late utility causes teammate to be caught out of position

**Rationale**: Mistakes that compound with team failures or trigger chain reactions have exponentially higher impact than isolated errors.

**Example:**

- Coordination Failure Rate: 0.5 (50% of instances)
- Cascading Mistake Rate: 0.25 (25% of instances)
- **TA = 1 + (0.5 × 0.5) + (0.25 × 0.3) = 1 + 0.25 + 0.075 = 1.325**

---

#### 4. Context Weight (CW)

**Formula:**

```
CW = Economy Factor × Score Pressure Factor × Map Control Factor
```

**Components:**

**Economy Factor:**

- Full buy: 1.0 (standard)
- Half buy: 1.2 (more critical, limited utility)
- Force buy: 1.5 (high stakes, must win)
- Eco: 0.8 (expected loss, less critical)

**Score Pressure Factor:**

- Even score: 1.0 (standard)
- Down 2+: 1.3 (high pressure, need to catch up)
- Up 2+: 0.9 (cushion, slightly less critical)

**Map Control Factor:**

- Based on site control, utility advantage, positioning (0.8-1.2)
- Simplified to 1.0 for initial implementation

**Example:**

- Economy: 50% full buy, 50% half buy → weighted = 1.1
- Score: 40% even, 40% down 2+, 20% up 2+ → weighted = 1.08
- Map Control: 1.0
- **CW = 1.1 × 1.08 × 1.0 = 1.188**

---

### Final TIS Calculation

```
TIS = Σ (MI_i × F_i × TA_i × CW_i) for all mistake types i
```

**Example (from sample data):**

**Mistake 1: Predictable Positioning**

- MI = 0.455
- F = 8.0
- TA = 1.325
- CW = 1.188
- **Contribution = 0.455 × 8.0 × 1.325 × 1.188 = 5.74 rounds/90min**

**Mistake 2: Late Utility Timing**

- MI = 0.720 (higher correlation: 0.8, late-round multiplier: 1.5)
- F = 5.0
- TA = 1.420 (higher coordination/cascade rates)
- CW = 1.188
- **Contribution = 0.720 × 5.0 × 1.420 × 1.188 = 6.08 rounds/90min**

**Total TIS = 5.74 + 6.08 = 11.82 rounds/90min**

_Note: This is a high-impact example for demonstration. Typical values range from 0.5-3.0._

---

## Interpretation Guide

| TIS Range     | Interpretation                                     | Action Required                      |
| ------------- | -------------------------------------------------- | ------------------------------------ |
| **< 0.5**     | Low impact — mistakes are isolated and recoverable | Monitor, low priority                |
| **0.5 - 1.5** | Moderate impact — noticeable tactical weakness     | Address in training, medium priority |
| **1.5 - 3.0** | High impact — significant team-level problem       | Focus area, high priority            |
| **> 3.0**     | Critical impact — major tactical vulnerability     | Immediate attention required         |

---

## Business Value Translation

### Expected Impact

If a player has **TIS = 2.0 rounds/90min**:

- **Per Match**: Saves ~2 rounds if behavior is corrected
- **Per 10 Matches**: ~0.2 expected wins (assuming ~10% round-to-win conversion)
- **Per Season**: Significant improvement in win rate and team coordination

### ROI Calculation

For a professional team:

- **Cost of correction**: 2-3 focused training sessions (~6-9 hours)
- **Value of 1 additional win**: $X (prize money, sponsorship, etc.)
- **ROI**: If correction saves 2 wins per season, ROI = (2 × $X) / (training cost)

---

## Implementation Notes

### Data Requirements

1. **Micro-analysis output**: Base severity scores for each mistake
2. **Historical correlation**: Round outcomes linked to mistake instances
3. **Context data**: Economy state, score, round phase, map control
4. **Coordination metrics**: Team sync events, execute/retake success rates
5. **Cascading analysis**: Temporal sequence of mistakes within rounds

### Calculation Frequency

- **Real-time**: Update TIS after each round (for live coaching)
- **Post-match**: Comprehensive TIS for full match analysis
- **Aggregated**: Weekly/monthly TIS trends for player development tracking

### Integration Points

- **Micro-Mistake Detector Agent**: Provides base severity and mistake instances
- **Macro-Strategy Analyst Agent**: Provides coordination failure rates and tactical context
- **Predictive Analytics Service**: Provides outcome correlations from historical data
- **Insight Engine**: Uses TIS to prioritize and rank actionable insights

---

## Example Use Cases

### Use Case 1: Post-Match Analysis

**Scenario**: Coach reviews match and sees Player Alpha has TIS = 2.5

**Action Card Generated:**

```
Priority: HIGH
Player: Alpha
TIS: 2.5 rounds/90min

Top Contributing Mistakes:
1. Predictable positioning (1.2 rounds/90min)
   - Focus: Vary angles, use off-angles
   - Drill: Position variation practice, 2x/week

2. Late utility timing (1.3 rounds/90min)
   - Focus: Earlier utility usage in executes
   - Drill: Execute timing drills, 1x/week

Expected Impact: Save ~2.5 rounds per match if corrected
Timeline: 3-4 weeks of focused training
```

### Use Case 2: Live Coaching

**Scenario**: During match, system detects recurring mistake pattern

**Live Alert:**

```
⚠️ TIS Alert: Player Alpha - Predictable Positioning
Current TIS contribution: 0.8 rounds/90min (projected)
Impact: High - 60% correlation with round losses
Recommendation: Remind player to vary positioning angles
```

### Use Case 3: Player Development Tracking

**Scenario**: Track TIS over time to measure improvement

**Trend Analysis:**

```
Player Alpha - TIS Trend (Last 10 Matches)
Week 1-2: 2.8 rounds/90min (Critical)
Week 3-4: 2.1 rounds/90min (High) ← Training intervention
Week 5-6: 1.4 rounds/90min (Moderate) ← Improvement visible
Week 7-8: 0.9 rounds/90min (Moderate) ← Continued progress
```

---

## Advantages Over Traditional Metrics

### Traditional Approach

- "Player made 8 positioning mistakes"
- "65% of rounds with mistakes were lost"
- **Problem**: No clear action priority or expected impact

### TIS Approach

- "Player's mistakes cost ~2.5 rounds per match"
- "If corrected, expect ~0.25 wins per 10 matches"
- **Advantage**: Clear business value, prioritized action items, measurable ROI

---

## Future Enhancements

1. **Sport-agnostic adaptation**: Adjust multipliers for different sports (soccer, basketball, etc.)
2. **Machine learning refinement**: Use ML to learn optimal multipliers from historical data
3. **Confidence intervals**: Provide statistical confidence bounds on TIS estimates
4. **Counterfactual simulation**: Show "what-if" scenarios if mistakes were corrected
5. **Team-level aggregation**: Calculate team TIS to identify systemic issues

---

## References

- Implementation: `backend/notebooks/team_impact_score.py`
- Integration: Micro-Mistake Detector Agent, Macro-Strategy Analyst Agent
- Related: Predictive Analytics Service, Insight Engine
