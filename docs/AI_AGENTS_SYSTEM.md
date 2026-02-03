# AI Agents System Documentation

## Overview

The AI Agents System is a multi-agent architecture that automates analysis of esports data using specialized AI modules. Each agent acts as a digital teammate, focusing on a specific aspect of the analysis pipeline to provide faster, deeper, and more proactive insights.

## Architecture

The system follows a modular agent architecture:

```
┌─────────────────────────────────────────┐
│      Agent Orchestrator                 │
│  (Coordinates multiple agents)          │
└──────────────┬──────────────────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│ Agent  │ │ Agent  │ │ Agent  │
│   1    │ │   2    │ │   N    │
└────────┘ └────────┘ └────────┘
```

## Agent Roles

### 1. Micro-Mistake Detector
**Role**: `micro_mistake_detector`

Identifies recurring individual errors and quantifies their impact on win probability.

**Key Features**:
- Analyzes GRID match telemetry and HY-Motion data
- Flags errors (e.g., "predictable peek")
- Generates animated corrections via HY-Motion
- Calculates win probability swing

**Usage**:
```typescript
import { MicroMistakeDetectorAgent } from '@/services/agents';

const agent = new MicroMistakeDetectorAgent();
const output = await agent.execute({
  grid_data: gridPackets,
  enriched_data: enrichedData,
});
```

### 2. Macro-Strategy Analyst
**Role**: `macro_strategy_analyst`

Connects individual mistakes to team-wide tactical failures.

**Key Features**:
- Analyzes aggregated round outcomes
- Identifies patterns (e.g., "Team loses 70% of rounds when Entry Fragger dies early")
- Suggests strategic adjustments
- Correlates micro actions with macro outcomes

**Usage**:
```typescript
import { MacroStrategyAnalystAgent } from '@/services/agents';

const agent = new MacroStrategyAnalystAgent();
const output = await agent.execute({
  round_data: roundData,
  enriched_data: enrichedData,
});
```

### 3. Opponent Scouting Agent
**Role**: `opponent_scouting`

Automates opponent analysis to predict their tactics.

**Key Features**:
- Analyzes historical match data from GRID
- Generates scouting reports
- Identifies preferred compositions and map-specific tendencies
- Analyzes clutch performance

**Usage**:
```typescript
import { OpponentScoutingAgent } from '@/services/agents';

const agent = new OpponentScoutingAgent();
const output = await agent.execute({
  opponent_data: opponentData,
  match_context: matchContext,
});
```

### 4. Predictive Playbook Agent
**Role**: `predictive_playbook`

Simulates outcomes of different strategies before matches.

**Key Features**:
- Runs thousands of simulations
- Recommends optimal draft picks
- Suggests veto orders
- Provides in-game adaptation recommendations

**Usage**:
```typescript
import { PredictivePlaybookAgent } from '@/services/agents';

const agent = new PredictivePlaybookAgent();
const output = await agent.execute({
  match_context: matchContext,
  opponent_data: opponentData,
});
```

### 5. Prosthetic Coach (Real-Time)
**Role**: `prosthetic_coach`

Acts as a real-time co-pilot during scrims or review.

**Key Features**:
- Processes live GRID data feed
- Provides tactical suggestions
- Alerts to detected patterns
- Generates real-time whispers

**Usage**:
```typescript
import { ProstheticCoachAgent } from '@/services/agents';

const agent = new ProstheticCoachAgent();
const output = await agent.execute({
  grid_data: liveGridData,
  live_feed: true,
});
```

## Agent Orchestration

The `AgentOrchestrator` coordinates multiple agents to work together.

### Coordination Strategies

1. **Sequential**: Agents execute one after another, each using outputs from previous agents
2. **Parallel**: Agents execute simultaneously, working independently
3. **Hierarchical**: Agents execute in levels, with dependencies between levels

### Example: Orchestrated Analysis

```typescript
import { agentOrchestrator } from '@/services/agents';

const result = await agentOrchestrator.orchestrate({
  agents: [
    'micro_mistake_detector',
    'macro_strategy_analyst',
    'opponent_scouting',
  ],
  input: {
    grid_data: gridPackets,
    match_context: matchContext,
    opponent_data: opponentData,
  },
  coordination_strategy: 'hierarchical',
  context_sharing: true,
});
```

## API Integration

The backend API service provides endpoints for agent interactions:

### Orchestrate Agents
```typescript
const result = await backendApi.orchestrateAgents({
  agents: ['micro_mistake_detector', 'macro_strategy_analyst'],
  input: { grid_data: packets },
  coordination_strategy: 'sequential',
});
```

### Execute Single Agent
```typescript
const output = await backendApi.executeAgent('micro_mistake_detector', {
  grid_data: packets,
});
```

### Analyze Round
```typescript
const result = await backendApi.analyzeRoundWithAgents(gridPackets, roundData);
```

### Get Opponent Scouting
```typescript
const scouting = await backendApi.getOpponentScouting('TeamName', matchContext);
```

### Get Predictive Playbook
```typescript
const playbook = await backendApi.getPredictivePlaybook(matchContext, opponentData);
```

### Get Live Coaching
```typescript
const coaching = await backendApi.getLiveCoaching(liveGridData, previousAnalysis);
```

## UI Components

### MultiAgentDashboard

A React component that displays insights from all agents:

```tsx
import { MultiAgentDashboard } from '@/components/agent/MultiAgentDashboard';

<MultiAgentDashboard
  gridData={gridPackets}
  matchContext={matchContext}
  opponentData={opponentData}
  onInsightClick={(insight) => {
    // Handle insight click
  }}
/>
```

## LLM Integration

Agents use LLM APIs for reasoning and decision-making. Currently configured for:

- **Provider**: OpenAI (configurable)
- **Model**: gpt-4o-mini (configurable)
- **Temperature**: 0.7 (configurable)

### Configuration

```typescript
const agent = new MicroMistakeDetectorAgent({
  provider: 'openai',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  max_tokens: 2000,
  api_key: process.env.OPENAI_API_KEY,
});
```

**Note**: In the current implementation, LLM calls are Sampleed for development. To enable real LLM calls, update the `callLLM` method in `baseAgent.ts` with actual API calls.

## Data Flow

1. **Input**: GRID data packets, match context, opponent data
2. **Processing**: Agents analyze data using heuristics and LLM reasoning
3. **Output**: Structured insights, recommendations, and actionable items
4. **Orchestration**: Multiple agents coordinate to provide comprehensive analysis
5. **UI**: Dashboard displays combined insights from all agents

## Integration with Existing Services

The agent system integrates with:

- **GRID Data Ingestion** (`gridIngestion.ts`): Provides enriched data
- **Heuristic Engine** (`heuristicEngine.ts`): Detects mistakes and patterns
- **Pattern Recognition** (`patternRecognition.ts`): Analyzes team coordination
- **Predictive Analytics** (`predictiveAnalytics.ts`): Correlates micro-macro outcomes
- **Backend API** (`backendApi.ts`): Exposes agent functionality
- **HY-Motion**: Generates motion visualizations for mistakes

## Future Enhancements

1. **Vector Database Integration**: Store playbooks and past analyses for context
2. **Real LLM API Calls**: Replace Sample implementations with actual API calls
3. **Agent Memory**: Persistent memory across sessions
4. **Fine-tuning**: Train agents on proprietary esports data
5. **Streaming Responses**: Real-time streaming of agent insights
6. **Agent Collaboration**: More sophisticated inter-agent communication

## Best Practices

1. **Start with One Agent**: Begin with Micro-Mistake Detector for clear inputs/outputs
2. **Use Orchestration**: Leverage orchestrator for complex multi-agent workflows
3. **Context Sharing**: Enable context sharing for agents that depend on each other
4. **Hierarchical Strategy**: Use hierarchical coordination for dependent analyses
5. **Monitor Performance**: Track execution times and optimize slow agents

## Troubleshooting

### Agent Not Found
Ensure the agent is registered in `orchestrator.ts`:
```typescript
const agentRegistry = new Map<AgentRole, any>([
  ['micro_mistake_detector', new MicroMistakeDetectorAgent()],
  // ...
]);
```

### LLM Errors
Check API key configuration and network connectivity. In development, agents use Sample responses.

### Performance Issues
- Use parallel coordination for independent agents
- Cache results for repeated analyses
- Limit context sharing for faster execution

## Examples

See the `MultiAgentDashboard` component for a complete example of using the agent system in a React application.



