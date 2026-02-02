// Personalized Insight Types - For the "Moneyball" coaching engine

import type { MotionSequence } from './backend';

export type InsightModuleType = 
  | 'PEEK_PREDICTABILITY'
  | 'UTILITY_EFFICIENCY'
  | 'TRADE_WINDOW'
  | 'ECONOMIC_DECISION'
  | 'MAP_CONTROL'
  | 'TEAM_COORDINATION'
  | 'OPENING_DUEL_IMPACT'
  | 'ROUND_WIN_CORRELATION'
  | 'MAP_SPECIFIC_PATTERN'
  | 'ECONOMIC_SNOWBALL';

export interface PersonalizedInsight {
  id: string;
  type: InsightModuleType;
  severity: number; // 0-1, where 1 is most critical
  title: string;
  description: string;
  recommendation: string;
  impact_metric: string;
  data: InsightData;
  // New format fields matching user requirements
  data_statement?: string; // e.g., "C9 loses nearly 4 out of 5 rounds (78%) when OXY dies 'for free'"
  insight?: string; // e.g., "Player OXY's opening duel success rate heavily impacts the team..."
  confidence?: number; // 0-1 confidence in the insight
  priority?: 'critical' | 'high' | 'medium' | 'low';
  supporting_evidence?: Array<Record<string, unknown>>;
  visualization?: {
    motion_sequence_id?: string;
    motion_prompt?: string;
    comparison_type?: 'mistake_vs_correct' | 'before_vs_after';
  };
  metadata: {
    player_id?: string;
    player_name?: string;
    team_id?: string;
    match_ids: string[];
    rounds_affected: number[];
    map_name?: string;
    generated_at: string;
  };
}

export interface InsightData {
  // Peek Predictability
  peek_patterns?: {
    clusters: PeekCluster[];
    predictability_score: number;
    first_death_correlation: number;
  };
  // Utility Efficiency
  utility_analysis?: {
    ability_name: string;
    success_rate: number;
    waste_rate: number;
    optimal_usage_count: number;
    actual_usage_count: number;
  };
  // Trade Window
  trade_analysis?: {
    trade_success_rate: number;
    avg_trade_time: number;
    missed_opportunities: number;
    positioning_issues: string[];
  };
  // Economic Decision
  economic_analysis?: {
    decision_type: 'force' | 'save' | 'buy';
    win_rate: number;
    expected_round_impact: number;
    optimal_strategy: string;
  };
  // Map Control
  map_control_analysis?: {
    weak_areas: string[];
    exposure_time: number;
    control_percentage: number;
    formation_gaps: string[];
  };
  // Team Coordination
  team_coordination?: {
    coordination_score: number;
    failed_rotations: number;
    utility_overlap: number;
    communication_issues: string[];
  };
}

export interface PeekCluster {
  avg_time: number; // seconds into round
  avg_angle: number; // degrees
  location: string;
  frequency: number;
  first_death_rate: number;
}

export interface PlayerInsightReport {
  player_id: string;
  player_name: string;
  generated_at: string;
  insights: PersonalizedInsight[];
  summary: {
    total_insights: number;
    critical_insights: number;
    focus_areas: string[];
    overall_improvement_potential: number;
  };
}

export interface TeamInsightReport {
  team_id: string;
  generated_at: string;
  player_reports: PlayerInsightReport[];
  team_insights: PersonalizedInsight[];
  summary: {
    team_weaknesses: string[];
    strategic_recommendations: string[];
    coordination_score: number;
  };
}

