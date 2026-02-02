# Hypothetical Outcome Prediction System

## Overview

The Hypothetical Outcome Prediction system allows coaches to ask "what if" questions about past strategic decisions and receive data-driven analysis comparing actual outcomes to hypothetical alternatives.

## Example Queries

### VALORANT Example
**Query:** "On Round 22 (score 10-11) on Haven, we attempted a 3v5 retake on C-site and lost. Would it have been better to save our weapons?"

**Output:**
```
The 3v5 retake had a 15% probability of success. Conceding the round and saving 3 rifles would have given the team a 60% chance to win the following gun round, versus the 35% chance they had on a broken buy. Saving was the superior strategic choice.
```

### League of Legends Example
**Query:** "C9 contested a Drake at 24:15 and everybody died. Would it have been better to not contest the objective at all?"

**Output:**
```
85% probability of 2 turret kills and +200 XP advantage per player if conceding the objective, versus 22% probability of winning the fight or the objective. Conceding was the better strategic choice.
```

## Architecture

### Core Components

1. **Prediction Agent** (`src/services/predictionAgent.ts`)
   - Main orchestrator for all prediction analysis
   - Parses natural language queries
   - Coordinates specialized analyzers
   - Generates strategic recommendations

2. **Specialized Analyzers**
   - **VALORANT Retake Analyzer** (`src/services/valorant/retakeAnalyzer.ts`)
     - Analyzes retake vs save scenarios
     - Calculates retake success probabilities
     - Estimates next round impact

3. **Prediction Engine** (`src/services/predictionEngine.ts`)
   - Monte Carlo simulation
   - Historical scenario matching
   - Probability distribution calculation

4. **Prediction Validator** (`src/services/predictionValidator.ts`)
   - Validates predictions for accuracy
   - Checks historical consistency
   - Ensures model agreement
   - Applies expert rules

5. **Game State Extractor** (`src/services/gameStateExtractor.ts`)
   - Extracts structured game state from GRID data
   - Provides context for predictions

## Usage

### Frontend Component

```tsx
import { WhatIfQuery } from '@/components/predictions/WhatIfQuery';

<WhatIfQuery
  matchId="match_123"
  currentReview={macroReview}
  onPredictionComplete={(result) => {
    console.log('Prediction:', result);
  }}
/>
```

### API Usage

```typescript
import { backendApi } from '@/services/backendApi';

// Natural language query
const result = await backendApi.analyzeWhatIfQuery(
  matchId,
  "Would it have been better to save in round 22?"
);

// Structured query
const prediction = await backendApi.predictHypothetical(
  matchId,
  {
    round_number: 22,
    change_type: 'economic_decision',
    original_action: 'force buy',
    hypothetical_action: 'save',
  }
);
```

### Direct Service Usage

```typescript
import { predictionAgent } from '@/services/predictionAgent';
import { valorantRetakeAnalyzer } from '@/services/valorant/retakeAnalyzer';

// Analyze what-if scenario
const result = await predictionAgent.analyzeWhatIf(
  matchId,
  "Would it have been better to save in round 22?",
  rounds,
  matchData,
  gridPackets
);

// Specialized retake analysis
const retakeAnalysis = await valorantRetakeAnalyzer.analyzeRetakeDecision(
  matchId,
  roundNumber,
  roundData,
  matchData,
  gridPackets
);
```

## Probability Calculation Methods

The system uses multiple methods to calculate success probabilities:

1. **Historical Lookup**
   - Finds similar scenarios from past matches
   - Calculates success rate from historical data
   - Weight: 40%

2. **Monte Carlo Simulation**
   - Runs 10,000+ simulations
   - Models game state transitions
   - Weight: 30%

3. **Model-Based Prediction**
   - Uses trained win probability models
   - Considers economic, momentum, and tactical factors
   - Weight: 30%

## Confidence Scoring

Predictions include confidence scores based on:

- **Historical Data Quality** (40%): More similar scenarios = higher confidence
- **Model Agreement** (30%): Multiple models agreeing = higher confidence
- **Expert Rule Validation** (30%): Passing expert rules = higher confidence

## Specialized Analyzers

### VALORANT Retake Analyzer

Analyzes retake scenarios considering:
- Player count (3v5, 2v4, etc.)
- Site control (0-1 scale)
- Time remaining (spike pressure)
- Player health and weapons
- Utility availability

**Base Probabilities:**
- 3v5 retake: 8% base probability
- 3v3 retake: 40% base probability
- 2v2 retake: 45% base probability

**Adjustments:**
- Site control: -30% max penalty
- Time pressure: -30% max penalty
- Health/weapons: -20% max penalty
- Utility: +15% bonus

## Integration Points

### With Macro Review

The system integrates with Macro Review to:
- Suggest "what if" scenarios from critical decisions
- Pre-populate queries based on review events
- Link predictions to specific review sections

### With GRID Data

The system uses GRID data to:
- Extract accurate game state
- Get player positions and health
- Determine round phase and objectives
- Calculate economic states

### With HY-Motion

The system generates visualization prompts for:
- Side-by-side comparison of actual vs hypothetical
- 3D animations showing alternative scenarios
- Key decision factors highlighted

## Example Output Format

```typescript
{
  query: "Would it have been better to save in round 22?",
  parsed_query: {
    round_number: 22,
    intent: "retake",
    scenario: "retake vs save"
  },
  actual_scenario: {
    success_probability: 0.15,
    outcome: "Loss",
    key_factors: ["3v5 disadvantage", "Strong site control", "Time pressure"]
  },
  hypothetical_scenario: {
    success_probability: 0.60,
    outcome: "Win (next round)",
    key_factors: ["Full buy next round", "Economic advantage", "Better positioning"]
  },
  strategic_recommendation: "The 3v5 retake had a 15% probability of success. Saving would have given a 60% chance to win the following gun round. Saving was the superior strategic choice.",
  confidence_score: 0.82,
  supporting_data: {
    success_probability_difference: 0.45,
    economic_advantage: 12000,
    momentum_impact: -0.1
  },
  specialized_analysis: {
    scenario: "3v5 retake on C-site",
    retake_success_probability: 0.15,
    save_impact: {
      next_round_win_probability: 0.60,
      economic_advantage: 12000,
      full_buy_probability: 0.95,
      momentum_impact: -0.1
    }
  }
}
```

## Future Enhancements

1. **League of Legends Objective Analyzer**
   - Analyze Drake/Baron contest decisions
   - Calculate gold/XP trade-offs
   - Predict map control impact

2. **CS2 Economy Analyzer**
   - Analyze force buy vs save decisions
   - Calculate weapon value preservation
   - Predict next round economy

3. **Advanced NLP**
   - Better intent detection
   - Multi-round scenario analysis
   - Temporal reasoning

4. **Real-time Predictions**
   - Live "what if" analysis during matches
   - Streaming probability updates
   - Instant strategic recommendations


