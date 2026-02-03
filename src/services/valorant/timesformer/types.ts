export interface UtilityState {
  type: string;
  position: number[]; // [x, y] 0-1 normalized
  status: 'active' | 'expired';
  startTime: number;
}

export interface MinimapFrame {
  timestamp: number;
  allyPositions: number[][];    // [x,y] 0-1 normalized
  enemyPositions: number[][];   // Known enemies only
  utilities: UtilityState[];    // Active smokes/flashes
  spikeState: 'down' | 'up' | 'planted';
}

export interface TimeSformerPrediction {
  enemyRotateProbability: number;  // 0-1
  ambushRisk: number;             // Enemy lurking
  utilityDenial: number;          // Smokes blocking rotation
  worstCaseAlert: string;         // "A Default rotate incoming"
}

export type ValorantRole = 'DUELIST' | 'CONTROLLER' | 'SENTINEL' | 'INITIATOR';

export interface OpponentAction {
  type: 'lurk_kill' | 'rotate_ambush' | 'default_execute';
  location?: string;
  agent?: string;
  utilSupport?: boolean;
  targetSite?: string;
  timing?: string;
  numbersAdvantage?: boolean;
  utilPerfect?: boolean;
}

export interface RecoveryScript {
  role: ValorantRole;
  steps: string[];
}

export interface TrainingDrill {
  name: string;
  scenario: string;
  focus: string;
  successMetric: string;
}

export interface SimulationResult {
  timestamp: number;
  minimapPrediction: TimeSformerPrediction;
  opponentAction: OpponentAction;
  yourRecoveryScript: string[];
  trainingDrill: TrainingDrill;
  panicLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
