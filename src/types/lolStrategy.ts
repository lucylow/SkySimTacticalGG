import { AgentOutput, AgentInsight } from './agents';

export type CompArchetype = 'engage' | 'poke' | 'pick' | 'front2back' | 'splitpush' | 'scale';

export type WinCondition = 
  | 'earlySnowball' 
  | 'frontToBack' 
  | 'pickComp' 
  | 'splitPush' 
  | 'objectiveStack' 
  | 'lateScaling';

export type Role = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOT' | 'SUPPORT';

export type GamePhase = 'EARLY' | 'MID' | 'LATE';

export type EnemyThreat = 'burst' | 'dps' | 'tanks' | 'poke' | 'cc';

export interface PatchSignals {
  earlyPressure?: number;
  scalingValue?: number;
  metaArchetypes?: CompArchetype[];
}

export interface ItemSpike {
  itemName: string;
  goldValue: number;
  isCompleted: boolean;
}

export interface PlayerDeath {
  player: string;
  time: number;
  cause: string;
  location: string;
}

export interface Layer1Static {
  myChamp: string;
  enemyChamp: string;
  teamComp: CompArchetype;
  enemyComp: CompArchetype;
  playerTendencies: Record<string, { winrate: number; aggression: number }>;
  patchMeta: PatchSignals;
  role: Role;
}

export interface Layer2Dynamic {
  matchTime: number;
  lanePriority: Record<string, number>;  // -1 to +1 per lane
  junglePathing: string[];              // ['red_start', 'gank_top']
  visionScore: number;
  objectiveTimers: Record<string, number>;
  goldDiff: number;
  itemSpikes: ItemSpike[];
}

export interface Layer3Feedback {
  lastFightResult: 'WIN' | 'LOSS' | 'EVEN';
  objectivesGained: string[];
  deaths: PlayerDeath[];
  adaptationSignals: string[];  // 'avoid_river', 'group_mid'
}

export interface FullGameState {
  layer1: Layer1Static;
  layer2: Layer2Dynamic;
  layer3: Layer3Feedback;
}

export interface RuneRecommendation {
  primary: string;
  secondary: string;
  shards: string[];
  rationale: string[];
}

export interface ItemRecommendation {
  mythic: string;
  core1: string;
  core2: string;
  situational: string[];
  pivotReason: string;
}

export interface StrategyOutput extends AgentOutput {
  winCondition: WinCondition;
  secondaryWinCondition: WinCondition;
  confidence: number;
  currentPriority: string;
  mapPlan: string[];
  comms: {
    primary: string;
    secondary: string;
    alerts: string[];
  };
  adaptation: string[];
  runes: RuneRecommendation;
  build: ItemRecommendation;
}
