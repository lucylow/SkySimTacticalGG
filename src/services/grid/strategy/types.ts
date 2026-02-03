export type CompArchetype = 'front2back' | 'engage' | 'poke' | 'split' | 'wombocombo';

export interface GridMockData {
  layer1: {
    myChamp: string;
    enemyChamp: string;
    teamComp: CompArchetype;
    enemyComp: CompArchetype;
    playerTendencies: Record<string, { winrate: number; aggression: number }>;
    patchMeta: { earlyPressure: number; scalingMeta: boolean };
  };
  layer2: {
    matchTime: number; // in seconds
    lanePriority: { top: number; mid: number; bot: number };
    junglePathing: string[];
    visionScore: number;
    objectiveTimers: { baron: number; drake: number; herald: 'taken' | number };
    goldDiff: number;
    itemSpikes: { player: string; item: string; complete: boolean }[];
  };
  layer3: {
    lastFightResult: 'WIN' | 'LOSS' | 'DRAW' | 'NONE';
    objectivesGained: string[];
    deaths: { player: string; timer: number }[];
    adaptationSignals: string[];
  };
}

export interface WinCondition {
  primary: string;
  confidence: number;
}

export interface RuneRecommendation {
  primary: string;
  secondary: string;
  shards: string;
}

export interface BuildRecommendation {
  mythic: string;
  core1: string;
  core2: string;
  situational: string;
}

export interface StrategyOutput {
  currentPriority: string;
  mapPlan: string[];
  comms: {
    primary: string;
    signals: string[];
  };
  winCondition: WinCondition;
  runes: RuneRecommendation;
  build: BuildRecommendation;
}

export type AdaptationSignals = string[];
