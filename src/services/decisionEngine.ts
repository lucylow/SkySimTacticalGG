
export interface DecisionInput {
  timeLeft: number;
  teamState: {
    playersAlive: number;
    avgHp: number;
    ultimatesUp: number;
    goldCash: number[];
  };
  enemyState: {
    playersAlive: number;
    ultimatesEstimated: number;
    cashEstimate: number;
  };
  resources: {
    utility: string[];
    weapons: string[];
  };
  mapObjective: string;
}

export interface DecisionOutput {
  recommendation: string;
  confidence: number;
  expectedValue: number;
  rationale: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
}

export class ValorantDraftEngine {
  makeBuyDecision(input: DecisionInput): DecisionOutput {
    const avgCash = input.teamState.goldCash.reduce((a, b) => a + b, 0) / input.teamState.goldCash.length;
    if (avgCash >= 4200) {
      return {
        recommendation: 'FULL_BUY',
        confidence: 0.92,
        expectedValue: 0.85,
        rationale: ['Strong economy', 'Full utility available'],
        urgency: 'HIGH'
      };
    }
    return {
      recommendation: 'ECO_SAVE',
      confidence: 0.95,
      expectedValue: 0.45,
      rationale: ['Preserve economy for next round'],
      urgency: 'MEDIUM'
    };
  }
}
