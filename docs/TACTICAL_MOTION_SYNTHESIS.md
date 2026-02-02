# Tactical Motion Synthesis Engine

## Overview

The **Tactical Motion Synthesis Engine** is the core innovation that transforms GRID esports data into actionable 3D motion visualizations using HY-Motion 1.0. This creates a "Moneyball for Esports" solution that goes beyond statistics, visualizing player decision-making and team strategies in real-time.

## Architecture

```
GRID Esports Data → Tactical Prompt Engine → HY-Motion 1.0 → 3D Motion Visualization
```

### Core Components

1. **Tactical Prompt Generation Engine** (`src/services/tacticalPromptEngine.ts`)
   - Translates GRID data into rich scene descriptors
   - Generates natural language prompts for HY-Motion 1.0
   - Includes predictive action modeling

2. **Enhanced Types** (`src/types/tactical.ts`)
   - Scene descriptors
   - Character descriptors with emotional/physical context
   - Motion vocabulary mappings
   - Tactical context layers

3. **Backend API Integration** (`src/services/backendApi.ts`)
   - `generateMotionFromGridData()` - Generate motion from GRID player data
   - `generatePredictivePlayVisualization()` - Predict next 30 seconds of play

## Key Features

### 1. Scene Descriptor Builder

Converts raw GRID data into rich scene descriptors with:
- Game state context (round phase, win probability, economy)
- Character descriptors (emotional state, physical context, role)
- Tactical directives
- Predicted actions

### 2. Emotional State Inference

Automatically infers player emotional states from:
- Clutch situations
- Win/loss streaks
- Round context
- Player performance metrics

### 3. Predictive Action Modeling

Heuristic-based prediction of next player actions:
- Post-plant utility usage
- Entry fragger peek patterns
- Anchor hold angles
- Retake rotations

### 4. Motion Vocabulary Mapping

Rich vocabulary library that maps tactical states to motion language:
- Entry fragger: "explosive urgency", "torso leading movement"
- Support: "coordinated", "high arcing trajectory"
- Clutch: "extreme focused stillness", "high pressure focus"
- AWPer: "extreme precision", "patient and deliberate"

### 5. Agent-Specific Motion Styles

VALORANT agent mappings:
- Jett: "light, acrobatic, and fluid"
- Brimstone: "deliberate, heavy, and authoritative"
- Sage: "calm, measured, and supportive"
- (Full list in `AGENT_MOTION_STYLES`)

## Usage Examples

### Basic: Generate Motion from GRID Data

```typescript
import { backendApi } from '@/services/backendApi';
import type { PlayerRoundStat, RoundData, MatchMetadata } from '@/types/backend';

const playerData: PlayerRoundStat = { /* ... */ };
const roundData: RoundData = { /* ... */ };
const matchData: MatchMetadata = { /* ... */ };
const gridSnapshot = {
  role: 'entry',
  agent: 'Jett',
  health: 100,
  is_moving: true,
  utility: ['flash', 'smoke'],
};

const motionSequence = await backendApi.generateMotionFromGridData(
  playerData,
  roundData,
  matchData,
  gridSnapshot
);
```

### Advanced: Predictive Play Visualization

```typescript
// Generate predictions for next 30 seconds of play
const motions = await backendApi.generatePredictivePlayVisualization(
  matchId,
  roundNumber,
  teamId
);

// Returns array of motion sequences for each predicted player action
```

### Direct: Tactical Prompt Generation

```typescript
import { generateOpponentGhostPrompt } from '@/services/tacticalPromptEngine';

const motionPrompt = generateOpponentGhostPrompt(
  playerData,
  roundData,
  gameState,
  gridSnapshot
);

// motionPrompt.prompt_text: "A professional esports player (Jett), moving in a light, acrobatic, and fluid manner..."
```

## Applications

### 1. Predictive Play Visualizer
Visualizes the most likely next 30 seconds of play, showing rotations, attack vectors, and defensive setups.

### 2. Prosthetic Coach AI
Creates a "ghost" avatar of the opposing player, simulating their likely peeks, utility throws, and retreat paths.

### 3. Next-Gen Broadcast
Generates cinematic 3D replays from any angle, making complex tactics accessible to all viewers.

### 4. Predictive Team Crafting
Simulates how a potential new recruit would move and coordinate within the existing team's strategic animations.

## Technical Details

### Data Flow

1. **GRID Data Ingestion**
   - Real-time WebSocket stream
   - Player positions, events, game state

2. **Enrichment & Context Layering**
   - Tactical context inference
   - Emotional state inference
   - Biomechanical data calculation

3. **Scene Descriptor Construction**
   - Multi-character scene building
   - Tactical directive generation
   - Action prediction

4. **Prompt Generation**
   - Motion vocabulary selection
   - Agent-specific style application
   - Natural language prompt assembly

5. **HY-Motion 1.0 Generation**
   - Prompt sent to model
   - 3D motion data returned (SMPL format)
   - Quality scoring

### Predictive Model (Current: Heuristic-Based)

The current implementation uses heuristic rules:
- `IF post_plant AND has_smoke AND time_remaining < 10 THEN action = "throw_smoke"`
- `IF role = entry AND has_flash THEN action = "peek_with_flash"`
- `IF role = anchor AND spike_planted THEN action = "hold_angle"`

**Future Enhancement**: Replace with trained ML model on historical GRID data.

## Performance Considerations

- **Latency**: For real-time use, consider model distillation
- **Motion Blending**: Use motion graphs to blend between generated clips
- **Fine-Tuning**: Ultimate competitive edge comes from fine-tuning HY-Motion 1.0 on proprietary esports motion-capture data

## Integration with GRID Data

The engine expects GRID data in the following format:

```typescript
interface GridSnapshot {
  role: string; // 'entry', 'support', 'awper', etc.
  agent?: string; // VALORANT agent name
  health: number;
  armor?: number;
  is_moving: boolean;
  is_crouching: boolean;
  utility?: string[]; // ['flash', 'smoke', 'grenade']
  utility_count?: Record<string, number>;
  position?: { x: number; y: number; z?: number };
  weapon?: string;
}
```

## Future Enhancements

1. **ML-Based Prediction**: Replace heuristics with trained models
2. **Motion Blending**: Seamless transitions between motion clips
3. **Real-Time Optimization**: Model distillation for low-latency
4. **Custom Fine-Tuning**: Train on proprietary esports motion data
5. **Multi-Player Coordination**: Generate synchronized team movements

## References

- **HY-Motion 1.0**: [HuggingFace Model](https://huggingface.co/tencent/HY-Motion-1.0)
- **GRID Esports Data**: Official esports data platform
- **Tactical Motion Synthesis**: Core innovation combining data + motion AI


