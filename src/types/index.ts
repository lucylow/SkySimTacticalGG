// Core Types for Esports Assistant Coach

export interface Player {
  id: string;
  name: string;
  team_id: string;
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel' | 'igl';
  avatar?: string;
  stats: PlayerStats;
}

export interface PlayerStats {
  kd_ratio: number;
  adr: number;
  hs_percentage: number;
  first_bloods: number;
  clutches_won: number;
  kast: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  players: Player[];
}

export interface Match {
  id: string;
  team_a: Team;
  team_b: Team;
  map: string;
  score: [number, number];
  duration: number;
  winner: string;
  rounds: Round[];
  created_at: string;
}

export interface Round {
  round_number: number;
  winner: string;
  win_type: 'elimination' | 'defuse' | 'time' | 'plant';
  events: RoundEvent[];
  mistakes?: Mistake[];
  motion_data?: MotionData;
}

export interface RoundEvent {
  timestamp: number;
  type: 'kill' | 'death' | 'ability' | 'plant' | 'defuse';
  player_id: string;
  target_id?: string;
  weapon?: string;
  description: string;
}

export interface Mistake {
  id: string;
  player_id: string;
  player_name: string;
  type: string;
  severity: number;
  description: string;
  recommendation: string;
  motion_data?: MotionData;
}

export interface MotionData {
  id: string;
  frames: MotionFrame[];
  skeleton: SkeletonBone[];
  fps: number;
  duration: number;
}

export interface MotionFrame {
  timestamp: number;
  joints: Joint[];
}

export interface Joint {
  name: string;
  position: [number, number, number];
  rotation: [number, number, number, number];
}

export interface SkeletonBone {
  name: string;
  parent: number;
}

export interface Insight {
  id: string;
  type: 'warning' | 'improvement' | 'success' | 'info';
  title: string;
  description: string;
  player_id?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  actionable: boolean;
}

export interface DashboardData {
  live_matches: Match[];
  recent_matches: Match[];
  team_stats: {
    win_rate: number;
    avg_round_time: number;
    map_performance: { map: string; wins: number; losses: number }[];
  };
  insights: Insight[];
  role_distribution: { name: string; value: number }[];
  last_update: string;
}

export interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

// Re-export API types for convenience
export type { WebSocketMessage as ApiWebSocketMessage } from '@/types/api';
