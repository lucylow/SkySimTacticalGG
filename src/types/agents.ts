// Multi-Agent System Types
// Defines the structure for specialized AI agents in SkySim Tactical GG

import type { GridDataPacket, PredictedAction } from './grid';
import type { EnrichedGridData } from './tactical';
import type { Mistake } from './index';

/**
 * Base agent interface - all agents implement this
 */
export interface BaseAgent {
  name: string;
  role: AgentRole;
  description: string;
  execute(input: AgentInput): Promise<AgentOutput>;
  getTools(): AgentTool[];
}

/**
 * Agent roles in the multi-agent system
 */
export type AgentRole =
  | 'micro_mistake_detector'
  | 'macro_strategy_analyst'
  | 'opponent_scouting'
  | 'predictive_playbook'
  | 'prosthetic_coach';

/**
 * Input structure for agents
 */
export interface AgentInput {
  grid_data?: GridDataPacket[];
  enriched_data?: EnrichedGridData[];
  round_data?: RoundDataInput;
  match_context?: MatchContextInput;
  opponent_data?: OpponentDataInput;
  previous_analysis?: any;
  live_feed?: boolean;
}

export interface RoundDataInput {
  round_number: number;
  round_outcome: 'win' | 'loss';
  round_phase: string;
  player_mistakes: Mistake[];
  economic_state: string;
  map: string;
}

export interface MatchContextInput {
  match_id: string;
  map: string;
  team_composition: string[];
  opponent_team: string;
  current_score: { team: number; opponent: number };
}

export interface OpponentDataInput {
  team_name: string;
  historical_matches: any[];
  preferred_compositions: string[];
  map_tendencies: MapTendency[];
  clutch_performance: ClutchPerformance;
}

export interface MapTendency {
  map: string;
  preferred_sites: string[];
  common_strategies: string[];
  success_rate: number;
}

export interface ClutchPerformance {
  one_v_one: number; // 0-1 win rate
  one_v_two: number;
  one_v_three: number;
  one_v_four: number;
  one_v_five: number;
}

/**
 * Output structure for agents
 */
export interface AgentOutput {
  agent_name: string;
  agent_role: AgentRole;
  timestamp: number;
  insights: AgentInsight[];
  recommendations: string[];
  confidence: number; // 0-1
  metadata?: Record<string, unknown>;
}

export interface AgentInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: number; // 0-1
  player_id?: string;
  round_number?: number;
  actionable: boolean;
  related_data?: unknown;
}

export type InsightType =
  | 'mistake'
  | 'pattern'
  | 'strategy'
  | 'prediction'
  | 'scouting'
  | 'tactical';

/**
 * Agent tool definition
 */
export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Micro-Mistake Detector specific outputs
 */
export interface MicroMistakeDetectorOutput extends AgentOutput {
  detected_mistakes: DetectedMistake[];
  motion_prompts: MotionPrompt[];
  win_probability_swing: number; // Impact of mistake on win probability
}

export interface DetectedMistake {
  mistake_id: string;
  player_id: string;
  mistake_type: string;
  description: string;
  severity: number;
  impact_on_round: number; // 0-1
  correction_prompt: string; // For HY-Motion visualization
  timestamp: number;
}

export interface MotionPrompt {
  player_id: string;
  action_type: string;
  prompt_text: string;
  confidence: number;
  timestamp: number;
}

/**
 * Macro-Strategy Analyst specific outputs
 */
export interface MacroStrategyAnalystOutput extends AgentOutput {
  tactical_patterns: TacticalPattern[];
  team_weaknesses: TeamWeakness[];
  strategic_adjustments: StrategicAdjustment[];
  correlation_analysis: CorrelationAnalysis[];
}

export interface TacticalPattern {
  pattern_id: string;
  description: string;
  frequency: number;
  success_rate: number;
  conditions: string[];
  recommendation: string;
}

export interface TeamWeakness {
  weakness_id: string;
  description: string;
  affected_rounds: number;
  win_rate_impact: number; // 0-1
  suggested_fix: string;
}

export interface StrategicAdjustment {
  adjustment_id: string;
  type: 'composition' | 'timing' | 'positioning' | 'economy';
  description: string;
  expected_impact: number; // 0-1
  implementation: string;
}

export interface CorrelationAnalysis {
  micro_action: string;
  macro_outcome: string;
  correlation_strength: number; // 0-1
  sample_size: number;
}

/**
 * Opponent Scouting Agent specific outputs
 */
export interface OpponentScoutingOutput extends AgentOutput {
  scouting_report: ScoutingReport;
  predicted_tactics: PredictedTactic[];
  vulnerabilities: OpponentVulnerability[];
}

export interface ScoutingReport {
  team_name: string;
  preferred_compositions: CompositionPreference[];
  map_specific_tendencies: MapTendency[];
  clutch_performance: ClutchPerformance;
  playstyle_analysis: string;
  key_players: KeyPlayer[];
}

export interface CompositionPreference {
  composition: string[];
  frequency: number;
  success_rate: number;
  maps: string[];
}

export interface KeyPlayer {
  player_id: string;
  role: string;
  strengths: string[];
  weaknesses: string[];
  impact_rating: number; // 0-1
}

export interface PredictedTactic {
  tactic_id: string;
  description: string;
  likelihood: number; // 0-1
  conditions: string[];
  counter_strategy: string;
}

export interface OpponentVulnerability {
  vulnerability_id: string;
  description: string;
  exploitability: number; // 0-1
  recommended_exploit: string;
}

/**
 * Predictive Playbook Agent specific outputs
 */
export interface PredictivePlaybookOutput extends AgentOutput {
  simulations: StrategySimulation[];
  optimal_draft: DraftRecommendation;
  veto_recommendations: VetoRecommendation[];
  in_game_adaptations: InGameAdaptation[];
}

export interface StrategySimulation {
  simulation_id: string;
  strategy: string;
  conditions: string[];
  win_probability: number; // 0-1
  expected_outcomes: string[];
  confidence: number;
}

export interface DraftRecommendation {
  recommended_picks: string[];
  reasoning: string;
  expected_advantage: number; // 0-1
  alternatives: string[][];
}

export interface VetoRecommendation {
  map: string;
  action: 'ban' | 'pick';
  reasoning: string;
  priority: number; // 0-1
}

export interface InGameAdaptation {
  adaptation_id: string;
  trigger_condition: string;
  recommended_change: string;
  expected_impact: number; // 0-1
}

/**
 * Prosthetic Coach (Real-Time) specific outputs
 */
export interface ProstheticCoachOutput extends AgentOutput {
  real_time_suggestions: RealTimeSuggestion[];
  pattern_alerts: PatternAlert[];
  tactical_whispers: TacticalWhisper[];
}

export interface RealTimeSuggestion {
  suggestion_id: string;
  timestamp: number;
  type: 'tactical' | 'economy' | 'positioning' | 'utility';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  player_target?: string;
}

export interface PatternAlert {
  alert_id: string;
  pattern_type: string;
  description: string;
  detected_at: number;
  confidence: number;
  action_required: boolean;
}

export interface TacticalWhisper {
  whisper_id: string;
  timestamp: number;
  message: string;
  context: string;
  priority: number;
}

/**
 * Agent orchestration types
 */
export interface AgentOrchestrationRequest {
  agents: AgentRole[];
  input: AgentInput;
  coordination_strategy?: 'sequential' | 'parallel' | 'hierarchical';
  context_sharing?: boolean;
}

export interface AgentOrchestrationResponse {
  request_id: string;
  timestamp: number;
  agent_outputs: AgentOutput[];
  combined_insights: CombinedInsight[];
  execution_time_ms: number;
}

export interface CombinedInsight {
  insight_id: string;
  source_agents: AgentRole[];
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
}

/**
 * Agent memory and learning
 */
export interface AgentMemory {
  agent_role: AgentRole;
  stored_insights: AgentInsight[];
  learned_patterns: string[];
  historical_context: Record<string, unknown>;
  last_updated: number;
}

/**
 * LLM configuration for agents
 */
export interface AgentLLMConfig {
  provider: 'openai' | 'anthropic' | 'azure' | 'local';
  model: string;
  temperature: number;
  max_tokens: number;
  api_key?: string;
}


