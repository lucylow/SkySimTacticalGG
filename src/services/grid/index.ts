// GRID Integration Service - Main export
// All GRID-related services and utilities

export { gridClient } from './gridClient';
export { eventNormalizer } from './eventNormalizer';
export { eventBus } from './eventBus';
export { matchStateEngine } from './matchState';
export { agentService } from './agentService';
export { ingestionService } from './ingestionService';
export { reviewService } from './reviewService';

// Re-export types
export type {
  CanonicalEvent,
  CanonicalEventType,
  RawGridEvent,
  MatchState,
  PlayerMatchStats,
  AgentSignal,
  AgentSignalType,
  MomentumSignal,
  StarPlayerSignal,
  EconomyCrashSignal,
} from '@/types/grid';


