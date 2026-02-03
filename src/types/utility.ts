export type GameType = 'VALORANT' | 'LOL';

export interface UtilityUsageRecommendation {
  type: string;
  purpose: string;
  timing: string;
  agents?: string[];
  winRateImpact: string;
  priority: number; // 1-3, 1 is highest
}

export interface TacticalUtilityState {
  game: GameType;
  matchTime: number; // seconds for Valorant, minutes for LoL (or seconds for both, let's stick to seconds)
  phase: string;
  role: string;
  agent?: string; // Champion for LoL
  economy?: number;
  inventory?: string[];
}

export interface ValorantUtilityGuide {
  category: string;
  purpose: string;
  timing: string;
  agents: string[];
  winRateImpact: string;
}

export interface LolSummonerSpellGuide {
  spell: string;
  phase: string;
  trigger: string;
  successRate: string;
}

export interface UtilityDecision {
  recommendations: UtilityUsageRecommendation[];
  decisionTreePath: string[];
  counterplay: string[];
  economyAdvice?: string;
  proBenchmarks: string[];
}

export interface UtilityMetric {
  name: string;
  immortalPlus?: string | number;
  radiant?: string | number;
  pro?: string | number;
  soloQueue?: string | number;
  diamondPlus?: string | number;
  challenger?: string | number;
  lckPro?: string | number;
}

export interface RoleBenchmark {
  role: string;
  metrics: {
    label: string;
    value: string | number;
    subtext?: string;
  }[];
}

export interface MapUtility {
  mapName: string;
  metrics: {
    label: string;
    value: string | number;
  }[];
}

export interface UtilityDashboardData {
  valorant: {
    coreKpis: UtilityMetric[];
    roleBenchmarks: RoleBenchmark[];
    mapDashboards: MapUtility[];
  };
  lol: {
    summonerSpellEfficiency: UtilityMetric[];
    objectiveSuccess: {
      name: string;
      soloQueue: string;
      lckPro: string;
    }[];
    roleBenchmarks: RoleBenchmark[];
  };
  economy: {
    valorant: {
      label: string;
      value: string;
    }[];
    lol: {
      label: string;
      value: string;
    }[];
  };
  gapAnalysis: {
    metric: string;
    soloQueue: string;
    pro: string;
    gap: string;
  }[];
  trainingTargets: {
    metric: string;
    current: string;
    target: string;
    weeklyGains: string[];
  }[];
}
