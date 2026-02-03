// Backend API Types - Matching the Python FastAPI backend schema

// ============= GRID Data Models =============

export interface MatchMetadata {
  id: string;
  game: 'valorant' | 'cs2';
  tournament?: string;
  map_name: string;
  start_time: string;
  end_time?: string;
  team_a_id: string;
  team_b_id: string;
  status: 'scheduled' | 'live' | 'completed';
}

export interface RoundData {
  id: string;
  match_id: string;
  round_number: number;
  winning_team_id?: string;
  round_type: 'pistol' | 'eco' | 'force' | 'full';
  duration_seconds: number;
  team_a_start_money: number;
  team_b_start_money: number;
  bomb_site?: 'A' | 'B' | 'C';
  round_phase_stats: {
    execute_time?: number;
    post_plant_time?: number;
    first_contact_time?: number;
    utility_used_early?: number;
  };
}

export interface PlayerRoundStat {
  id: string;
  round_id: string;
  player_id: string;
  team_id: string;
  positioning_score: number;
  crosshair_placement_score: number;
  utility_efficiency: number;
  trade_deaths: number;
  clutchness_score: number;
  position_heatmap: { x: number[]; y: number[] };
  death_location?: { x: number; y: number };
  motion_sequence_id?: string;
}

// ============= Analysis Models =============

export interface StrategicPattern {
  id: string;
  team_id: string;
  map_name: string;
  side: 'attack' | 'defense';
  pattern_type: 'default' | 'execute' | 'retake' | 'eco_round';
  success_rate: number;
  avg_execution_time: number;
  ideal_motion_sequence_id?: string;
  common_mistakes: string[];
  key_player_actions: Record<string, string>;
  win_conditions: string[];
}

export interface PlayerMistake {
  id: string;
  player_id: string;
  player_name: string;
  match_id: string;
  mistake_type: 'positioning' | 'utility' | 'timing' | 'communication';
  severity: number;
  timestamp: string;
  round_number: number;
  game_state: {
    player_count_alive: number;
    time_remaining: number;
    economy_state: string;
  };
  expected_action: string;
  actual_action: string;
  round_impact: number;
  match_impact: number;
  correction_suggestion: string;
  motion_sequence_id?: string;
  corrected_motion_id?: string;
}

export interface MotionSequence {
  id: string;
  prompt_used: string;
  motion_data: {
    smpl_params: number[];
    joint_positions: number[][];
  };
  duration_frames: number;
  fps: number;
  action_type: 'peek' | 'throw' | 'defuse' | 'plant' | 'rotate';
  player_role: 'entry' | 'support' | 'awper' | 'controller' | 'anchor';
  quality_score: number;
}

// ============= Micro-Macro Analytics =============

export interface MicroMacroConnection {
  player_id: string;
  timeframe_minutes: number;
  total_mistakes: number;
  strategy_impacts: StrategyImpact[];
}

export interface StrategyImpact {
  mistake_type: string;
  round_number: number;
  impact_score: number;
  strategy_broken: string;
  win_probability_swing: number;
  corrective_action: string;
  motion_visualization_id?: string;
}

export interface TeamPattern {
  team_id: string;
  total_patterns_identified: number;
  patterns: PatternDetail[];
  pattern_strengths: Record<string, number>;
  recommended_strategies: string[];
}

export interface PatternDetail {
  pattern_type: string;
  success_rate: number;
  frequency: number;
  key_players: string[];
  typical_execution_time: number;
  counter_strategies: string[];
}

// ============= Coaching Insights =============

export interface CoachingInsight {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'macro' | 'connection';
  priority: 'high' | 'medium' | 'low';
  evidence: string[];
  impact_score: number;
  recommendations: string[];
  metadata?: {
    mistake_type?: string;
    player_ids?: string[];
    rounds_affected?: number[];
  };
}

export interface ActionItem {
  insight_id: string;
  title: string;
  drills: DrillRecommendation[];
  strategy_changes: string[];
  player_feedback: PlayerFeedback[];
  estimated_impact: number;
  implementation_time: string;
}

export interface DrillRecommendation {
  name: string;
  description: string;
  duration: string;
  focus: string;
  setup: string;
}

export interface PlayerFeedback {
  player_id: string;
  player_name: string;
  feedback: string;
  priority: 'high' | 'medium' | 'low';
}

// ============= Development Plan =============

export interface DevelopmentPlan {
  player_id: string;
  timeframe_days: number;
  generated_at: string;
  focus_areas: FocusArea[];
  weekly_goals: WeeklyGoal[];
  skill_progression: SkillProgression[];
  recommended_vods: string[];
}

export interface FocusArea {
  area: string;
  current_level: number;
  target_level: number;
  priority: 'high' | 'medium' | 'low';
  exercises: string[];
}

export interface WeeklyGoal {
  week: number;
  objectives: string[];
  metrics_to_track: string[];
  expected_improvement: number;
}

export interface SkillProgression {
  skill: string;
  current: number;
  projected: number[];
  milestones: string[];
}

// ============= API Response Types =============

export interface ComprehensiveAnalysisResponse {
  match_id: string;
  analysis_completed: string;
  micro_analysis: MicroAnalysis;
  macro_analysis: MacroAnalysis;
  micro_macro_connections: MicroMacroConnection;
  coaching_insights: {
    generated_at: string;
    team_id: string;
    match_id: string;
    summary: string;
    key_insights: CoachingInsight[];
    action_items: ActionItem[];
    visualizations: VisualizationSpec[];
  };
  actionable_items: ActionItem[];
}

export interface MicroAnalysis {
  team_id: string;
  match_id: string;
  player_performances: PlayerPerformanceDetail[];
  mistakes_detected: PlayerMistake[];
  standout_moments: StandoutMoment[];
}

export interface MacroAnalysis {
  team_id: string;
  match_id: string;
  strategy_effectiveness: Record<string, number>;
  round_type_performance: Record<string, { wins: number; losses: number }>;
  economy_management_score: number;
  adaptation_score: number;
  patterns_identified: StrategicPattern[];
}

export interface PlayerPerformanceDetail {
  player_id: string;
  player_name: string;
  role: string;
  overall_rating: number;
  mechanical_score: number;
  tactical_score: number;
  utility_score: number;
  communication_score: number;
  key_moments: string[];
}

export interface StandoutMoment {
  player_id: string;
  round_number: number;
  description: string;
  impact: 'positive' | 'negative';
  highlight_type: 'clutch' | 'ace' | 'entry' | 'save' | 'mistake';
}

export interface VisualizationSpec {
  type: 'heatmap' | 'timeline' | 'comparison' | 'motion';
  data_source: string;
  config: Record<string, unknown>;
}

// ============= Health & Status =============

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    kafka: boolean;
    ml_models: boolean;
  };
}

export interface APIInfo {
  message: string;
  version: string;
  endpoints: Record<string, string>;
}

// ============= Macro Review Types =============

export interface MacroReviewEvent {
  type: 'CRITICAL_ECONOMIC_DECISION' | 'FAILED_EXECUTE' | 'MOMENTUM_SHIFT' | 'MAP_CONTROL_LOSS' | 'CLUTCH_SITUATION' | 'PISTOL_ROUND_IMPACT';
  round_number: number;
  title: string;
  description: string;
  impact_score: number;
  strategic_insight: string;
  recommendation: string;
  needs_visualization?: boolean;
  visualization_type?: 'team_execute' | 'economic_flow' | 'map_control' | 'clutch';
  round_ids?: number[];
  motion_visualization?: MotionSequence;
  motion_prompt?: string;
}

export interface MacroReviewAgendaPhase {
  phase: string;
  focus: string;
  items: MacroReviewEvent[];
  time_allocation: string;
  coaching_question: string;
}

export interface MacroReview {
  match_id: string;
  generated_at: string;
  summary: string;
  key_themes: string[];
  review_agenda: MacroReviewAgendaPhase[];
  action_items: ActionItem[];
  what_if_analyses?: WhatIfAnalysis[];
}

// ============= What-If Prediction Types =============

export interface WhatIfScenario {
  round_number: number;
  change_type: 'economic_decision' | 'strategy_change' | 'player_action' | 'timing_adjustment';
  original_action: string;
  hypothetical_action: string;
  player_affected?: string;
  context?: string;
}

export interface WhatIfModification {
  round_number: number;
  change_type: 'economic_decision' | 'strategy_change' | 'player_action' | 'timing_adjustment';
  original_action: string;
  hypothetical_action: string;
  player_affected?: string;
  context?: Record<string, unknown>;
}

export interface SimulatedRound {
  round_number: number;
  winning_team_id?: string;
  round_type: 'pistol' | 'eco' | 'force' | 'full';
  team_a_economy: number;
  team_b_economy: number;
  win_probability: number;
  is_modified: boolean;
}

export interface SimulationOutcome {
  team_wins: boolean;
  final_score: [number, number];
  round_difference: number;
  rounds: SimulatedRound[];
  key_moments: string[];
}

export interface ProbabilityDistribution {
  [score: string]: number; // e.g., "13-10": 0.35
}

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  confidence_level: number;
}

export interface WhatIfPrediction {
  scenario_id: string;
  query: WhatIfModification;
  predicted_outcome: {
    win_probability: number;
    most_likely_score: string;
    average_round_difference: number;
    confidence_interval: ConfidenceInterval;
  };
  confidence_score: number;
  probability_distribution: ProbabilityDistribution;
  key_findings: string[];
  comparison_to_actual: {
    actual_score: string;
    predicted_score: string;
    round_difference: number;
    win_probability_change: number;
  };
  recommended_strategy: string;
  visualization?: {
    type: 'comparison' | 'hypothetical' | 'side_by_side';
    motion_sequence_id?: string;
    description: string;
  };
  simulation_metadata: {
    num_simulations: number;
    historical_scenarios_found: number;
    factors_considered: string[];
  };
}

export interface WhatIfAnalysis {
  scenario: WhatIfScenario;
  prediction: WhatIfPrediction;
  generated_at: string;
  review_section_id?: string;
}
