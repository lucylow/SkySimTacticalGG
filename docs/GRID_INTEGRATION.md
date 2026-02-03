# GRID Esports Data Integration

This document describes the complete GRID esports data integration system implemented in this application.

## Overview

This implementation provides a complete, hackathon-ready GRID integration that demonstrates:
- Real-time event ingestion from GRID (Sample for demo)
- Canonical event normalization (game-agnostic)
- Match state reconstruction
- AI agent reasoning (momentum, star players, economy)
- Human-in-the-loop review workflow
- Real-time visualization dashboard

## Architecture

```
GRID API (Sample)
    │
    ▼
GridClient → Raw Events
    │
    ▼
EventNormalizer → Canonical Events
    │
    ▼
EventBus (In-Memory)
    ├──→ MatchStateEngine (State Reconstruction)
    ├──→ AgentService (AI Reasoning)
    └──→ Frontend Components (Visualization)
```

## Key Components

### Services

#### `gridClient.ts`
- Sample GRID stream client
- Generates realistic esports events (matches, rounds, kills, etc.)
- In production, would connect to real GRID WebSocket API

#### `eventNormalizer.ts`
- Converts raw GRID events to canonical format
- Game-agnostic event schema
- Supports: MATCH_START, MAP_START, ROUND_START, KILL, ASSIST, OBJECTIVE, ROUND_END, etc.

#### `eventBus.ts`
- In-memory event bus (replaces Redis for frontend)
- Pub/sub pattern for event distribution
- Stores raw events, canonical events, and agent signals
- Manages review queue

#### `matchState.ts`
- Reconstructs match state from events
- Tracks scores, player stats, economy
- Replayable from event history

#### `agentService.ts`
- AI agent that reasons over events
- Detects:
  - **Momentum shifts**: 3+ consecutive wins
  - **Star players**: High kill percentage + opening kill rate
  - **Economy crashes**: Significant economy drops
- Generates signals with confidence scores and explanations

#### `ingestionService.ts`
- Main orchestrator
- Coordinates: GRID → Normalize → Event Bus → State → Agents

#### `reviewService.ts`
- Human-in-the-loop workflow
- RBAC (viewer, reviewer, admin)
- Approve/reject agent signals

### React Hooks

- `useGridEvents`: Subscribe to canonical events
- `useAgentSignals`: Subscribe to AI agent signals
- `useReviewQueue`: Manage review queue
- `useMatchState`: Get reconstructed match state

### UI Components

- `EventTimeline`: Visual timeline of all events
- `AgentInsights`: Display approved AI agent signals
- `ReviewQueue`: Human review interface
- `MatchStateDisplay`: Reconstructed match state (score, economy, players)

### Pages

- `GridDashboard`: Main dashboard at `/app/grid`

## Usage

### Starting Ingestion

```typescript
import { ingestionService } from '@/services/grid';

// Start ingesting a match
await ingestionService.ingestMatch('match-123');
```

### Subscribing to Events

```typescript
import { useGridEvents } from '@/hooks/useGridEvents';

function MyComponent() {
  const { events, isConnected } = useGridEvents('match-123');
  // events will update in real-time
}
```

### Reviewing Agent Signals

```typescript
import { reviewService } from '@/services/grid';

// Set user role
reviewService.setUser('user-123', 'reviewer');

// Approve/reject signals
reviewService.approveSignal('signal-id');
reviewService.rejectSignal('signal-id');
```

## Event Flow

1. **GRID Client** generates/streams raw events
2. **Event Normalizer** converts to canonical format
3. **Event Bus** publishes to subscribers
4. **Match State Engine** updates match state
5. **Agent Service** analyzes events and generates signals
6. **Review Service** manages human approval workflow
7. **Frontend Components** visualize everything in real-time

## Canonical Event Schema

All events follow this structure:

```typescript
interface CanonicalEvent {
  event_id: string;
  event_type: 'MATCH_START' | 'MAP_START' | 'ROUND_START' | 'KILL' | ...;
  game: string;
  match_id: string;
  map?: string;
  round?: number;
  timestamp: string;
  actor?: string;  // e.g., "player:p1"
  target?: string;
  team?: string;
  payload: Record<string, unknown>;
}
```

## AI Agent Signals

Agent signals include:
- Type (MOMENTUM_SHIFT, STAR_PLAYER, ECONOMY_CRASH, etc.)
- Confidence score (0-1)
- Explanation (structured data)
- Status (PENDING_REVIEW, APPROVED, REJECTED)

## Production Considerations

This is a frontend-only implementation suitable for:
- Hackathons
- Prototypes
- Demos
- Development

For production, you would:
1. Replace Sample GRID client with real GRID API integration
2. Use Redis/Kafka for event bus (instead of in-memory)
3. Add backend service for ingestion (FastAPI/Node.js)
4. Add database persistence
5. Add authentication/authorization
6. Add monitoring and logging
7. Scale horizontally with multiple workers

## Route

Access the GRID dashboard at: `/app/grid`

## Data Provenance

All events maintain full provenance:
- Raw events are stored (immutable)
- Canonical events reference raw events
- Match state can be rebuilt from events
- Agent signals reference source events
- Review decisions are logged

This ensures:
- Debuggability
- Reproducibility
- Auditability
- Trust with judges/users

## Next Steps

Potential enhancements:
- Add more agent types (strategy detection, clutch opportunities)
- Add ML-based confidence scoring
- Add replay visualization
- Add export functionality
- Add metrics and analytics
- Add multi-match support
- Add historical match analysis



