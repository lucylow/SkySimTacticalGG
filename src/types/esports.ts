// Esports Specific Types for League of Legends and Valorant

export type GameType = 'lol' | 'valorant';

export type LoLRole = 'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT';
export type ValorantRole = 'duelist' | 'initiator' | 'controller' | 'sentinel' | 'igl';

export interface BasePlayer {
  id: string;
  name: string;
  team_id: string;
  avatar?: string;
  game: GameType;
}

export interface LoLPlayer extends BasePlayer {
  game: 'lol';
  role: LoLRole;
  stats: LoLPlayerStats;
  puuid?: string;
  region?: string;
}

export interface ValorantPlayer extends BasePlayer {
  game: 'valorant';
  role: ValorantRole;
  stats: ValorantPlayerStats;
}

export interface LoLPlayerStats {
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
  cs_at_10: number;
  cs_at_15: number;
  gold_at_10: number;
  gold_at_15: number;
  vision_score: number;
  win_rate: number;
  champion_pool: { champion: string; games: number; win_rate: number; kda: number }[];
}

export interface ValorantPlayerStats {
  kd_ratio: number;
  adr: number;
  hs_percentage: number;
  first_bloods: number;
  clutches_won: number;
  kast: number;
  win_rate: number;
  agent_pool: { agent: string; games: number; win_rate: number; kd: number }[];
}

export type EsportsPlayer = LoLPlayer | ValorantPlayer;

export interface EsportsTeam {
  id: string;
  name: string;
  logo?: string;
  game: GameType;
  players: EsportsPlayer[];
}

export interface EsportsMatch {
  id: string;
  game: GameType;
  team_a: EsportsTeam;
  team_b: EsportsTeam;
  score: [number, number];
  winner: string;
  patch?: string;
  created_at: string;
  meta?: Record<string, any>;
}
