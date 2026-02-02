// Agent System Exports
// Central export point for all agent-related functionality

export { BaseAgentImpl } from './baseAgent';
export { MicroMistakeDetectorAgent } from './microMistakeDetector';
export { MacroStrategyAnalystAgent } from './macroStrategyAnalyst';
export { OpponentScoutingAgent } from './opponentScouting';
export { PredictivePlaybookAgent } from './predictivePlaybook';
export { ProstheticCoachAgent } from './prostheticCoach';
export { agentOrchestrator, AgentOrchestrator } from './orchestrator';

// Re-export types
export type {
  BaseAgent,
  AgentRole,
  AgentInput,
  AgentOutput,
  AgentTool,
  AgentOrchestrationRequest,
  AgentOrchestrationResponse,
} from '@/types/agents';


