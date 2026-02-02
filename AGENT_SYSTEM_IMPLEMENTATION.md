# AI Agent System Implementation

## Overview

A comprehensive multi-agent workflow system has been implemented to power the three main features of the esports assistant coach:
- **Personalized Insights**: Player-specific pattern detection and analysis
- **Macro Reviews**: Strategic match analysis and agenda generation
- **Hypothetical Predictions**: "What if" scenario simulations

## Architecture

### Core Components

1. **Base Agent System** (`src/agents/BaseAgent.ts`)
   - Abstract base class for all agents
   - Common functionality: processing timers, logging, configuration

2. **Specialized Agents**
   - **DataFetcherAgent**: Fetches player/match data from GRID API
   - **MicroPatternDetectorAgent**: Detects recurring player patterns and mistakes
   - **StrategicAnalyzerAgent**: Connects micro patterns to macro outcomes
   - **SimulationAgent**: Runs Monte Carlo simulations for "what if" scenarios
   - **FormatterAgent**: Formats insights into coach-friendly output
   - **ValidatorAgent**: Validates insights for accuracy and relevance

3. **Orchestrator Agent** (`src/agents/OrchestratorAgent.ts`)
   - Coordinates all specialized agents
   - Manages workflow execution
   - Handles task decomposition and dependency resolution

4. **Workflows** (`src/workflows/`)
   - **PersonalizedInsightsWorkflow**: Complete pipeline for player insights
   - **MacroReviewWorkflow**: Strategic review generation
   - **HypotheticalPredictionsWorkflow**: Scenario simulation pipeline

5. **Communication System** (`src/agents/communication.ts`)
   - MessageBus for inter-agent communication
   - Pub/sub pattern for agent coordination
   - Request/response pattern for task execution

6. **Monitoring System** (`src/agents/monitoring.ts`)
   - Tracks agent performance metrics
   - Generates health reports
   - Monitors success rates and processing times

7. **Frontend Dashboard** (`src/components/agents/AgentDashboard.tsx`)
   - Real-time agent status monitoring
   - Performance metrics visualization
   - Workflow execution timeline

8. **API Service** (`src/services/agentApi.ts`)
   - Frontend service for interacting with agent system
   - High-level workflow execution methods
   - Agent status queries

## File Structure

```
src/
├── agents/
│   ├── types.ts                    # Agent type definitions
│   ├── BaseAgent.ts                # Base agent class
│   ├── DataFetcherAgent.ts         # Data fetching agent
│   ├── MicroPatternDetectorAgent.ts # Pattern detection agent
│   ├── StrategicAnalyzerAgent.ts   # Strategic analysis agent
│   ├── SimulationAgent.ts          # Simulation agent
│   ├── FormatterAgent.ts           # Formatting agent
│   ├── ValidatorAgent.ts           # Validation agent
│   ├── OrchestratorAgent.ts        # Orchestrator agent
│   ├── communication.ts           # Message bus
│   ├── monitoring.ts               # Performance monitoring
│   ├── config.ts                   # Configuration
│   └── index.ts                    # Exports
├── workflows/
│   ├── PersonalizedInsightsWorkflow.ts
│   ├── HypotheticalPredictionsWorkflow.ts
│   ├── MacroReviewWorkflow.ts
│   └── index.ts
├── services/
│   └── agentApi.ts                 # Agent API service
└── components/
    └── agents/
        └── AgentDashboard.tsx      # Frontend dashboard
```

## Usage Examples

### Personalized Insights

```typescript
import { agentApi } from '@/services/agentApi';

const result = await agentApi.processPersonalizedInsights({
  player_id: 'player-123',
  match_ids: ['match-1', 'match-2'],
});

console.log(result.results.insights);
```

### Macro Review

```typescript
const result = await agentApi.processMacroReview({
  match_id: 'match-123',
  team_id: 'team-456',
});

console.log(result.results.agenda);
```

### Hypothetical Predictions

```typescript
const result = await agentApi.processHypotheticalPrediction({
  match_id: 'match-123',
  modification: {
    player_improvement: true,
    strategy_change: 'aggressive',
  },
});

console.log(result.results.probabilities);
```

### Agent Status Monitoring

```typescript
const status = await agentApi.getAgentStatus();
console.log(status.summary.healthy_agents);
```

## Agent Workflow Example

### Personalized Insights Workflow

1. **Data Collection** (DataFetcherAgent)
   - Fetches player match data and telemetry
   - Returns structured performance data

2. **Pattern Detection** (MicroPatternDetectorAgent)
   - Analyzes opening duels
   - Detects utility inefficiency
   - Identifies positioning patterns

3. **Strategic Correlation** (StrategicAnalyzerAgent)
   - Correlates micro patterns with round outcomes
   - Calculates impact scores
   - Generates strategic implications

4. **Formatting** (FormatterAgent)
   - Formats insights into coach-friendly output
   - Generates recommendations
   - Creates actionable items

5. **Validation** (ValidatorAgent)
   - Validates insight accuracy
   - Checks data consistency
   - Assigns confidence scores

## Configuration

Agent configuration is defined in `src/agents/config.ts`:

```typescript
import { defaultAgentConfig } from '@/agents/config';

// Configure agent thresholds
defaultAgentConfig.agents[AgentRole.MICRO_ANALYZER].pattern_threshold = 0.8;
defaultAgentConfig.agents[AgentRole.SIMULATION_AGENT].default_simulations = 2000;
```

## Monitoring

The monitoring system tracks:
- Task processing counts
- Success rates
- Average processing times
- Error logs
- Specialty accuracy per task type

Access via:
```typescript
import { agentMonitor } from '@/agents/monitoring';

const report = agentMonitor.getAgentHealthReport();
console.log(report.overall_success_rate);
```

## Frontend Integration

Add the Agent Dashboard to your routes:

```typescript
import { AgentDashboard } from '@/components/agents/AgentDashboard';

// In your router
<Route path="/agents" element={<AgentDashboard />} />
```

## Key Features

1. **Modular Specialization**: Each agent focuses on one capability
2. **Orchestrated Collaboration**: Agents work together through workflows
3. **Real-time Monitoring**: Track agent health and performance
4. **Scalable Architecture**: Easy to add new agents or workflows
5. **Fault Tolerance**: Individual agent failures don't break the system
6. **Transparent Operation**: Full visibility into AI decision-making

## Next Steps

1. **Backend Integration**: Connect to actual GRID API endpoints
2. **WebSocket Support**: Real-time agent updates via WebSocket
3. **Caching Layer**: Cache agent results for performance
4. **Advanced Analytics**: Enhanced pattern recognition algorithms
5. **Agent Learning**: Implement agent performance improvement over time

## Notes

- All agents are currently frontend-only implementations
- For production, agents should run on a backend server
- The system is designed to be easily migrated to a backend architecture
- Current implementation uses mock data and simplified algorithms
- Real implementations would require more sophisticated analysis


