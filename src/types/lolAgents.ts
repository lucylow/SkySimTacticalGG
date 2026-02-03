import { AgentInsight, AgentOutput } from './agents';

export type LoLOpponentArchetype = 
  | 'Lane Bully' 
  | 'Scaling Carry' 
  | 'Roamer' 
  | 'All-In Assassin' 
  | 'Utility / Tank';

export interface LoLPowerWindow {
  phase: string;
  timing: string;
  danger_level: number; // 0-1
}

export interface LoLOpponentProfile {
  championName: string;
  archetype: LoLOpponentArchetype;
  powerWindows: LoLPowerWindow[];
  keyAbility: {
    name: string;
    key: string;
    description: string;
    impact: string;
  };
  behaviorReads?: string[];
  summonerSpells: {
    flash: boolean;
    ignite?: boolean;
    teleport?: boolean;
    exhaust?: boolean;
    barrier?: boolean;
    heal?: boolean;
    ghost?: boolean;
    cleanse?: boolean;
    smite?: boolean;
    last_used?: number;
  };
  itemSpikes: string[];
}

export interface LoLOpponentAnalysisOutput extends AgentOutput {
  opponent_profile: LoLOpponentProfile;
  game_plan: string;
  lane_behavior_read: string;
  map_tendencies: string;
  mid_game_read: string;
  mistakes_to_exploit: string[];
}
