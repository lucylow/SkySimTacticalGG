export type ObjectiveType = 'DRAGON' | 'BARON' | 'HERALD' | 'TOWER';
export type RecommendationType = 'SECURE' | 'CONTEST' | 'AVOID' | 'TRADE';

export interface ObjectiveState {
  objective: ObjectiveType;
  timeToSpawn: number; // seconds
  matchTime: number; // total game time
  teamGoldDiff: number;
  allyCountNear: number;
  enemyCountNear: number;
  visionInPit: number; // friendly wards
  enemyVisionInPit: number;
  ultimatesUp: number; // team ultimates ready
  enemyUltimatesUp: number;
  smiteReady: boolean;
  enemySmiteReady: boolean;
  sidelanePressure: boolean; // can we threaten sidelanes?
  playerHpPercent: number; // avg team HP%
}

export interface ObjectiveDecision {
  recommendation: RecommendationType;
  confidence: number;
  expectedValue: number;
  rationale: string[];
  pSuccess: number;
  winProbDelta: number; // % winrate increase
  coachCall: string; // 1-3 word call
}
