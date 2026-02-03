import { ObjectiveState, ObjectiveDecision, RecommendationType } from '../types/objectives';

export class LolObjectiveEngine {
  private readonly OBJECTIVE_VALUES = {
    DRAGON: { base: 0.06, elder: 0.15 }, // +6-15% win prob
    BARON: 0.12, // +12% avg
    HERALD: 0.04, // +4%
    TOWER: 0.03 // +3% per outer
  };

  public decideDragon(state: ObjectiveState): ObjectiveDecision {
    const pSuccess = this.calculatePSuccess(state);
    const baseValue = state.matchTime > 2100 ? this.OBJECTIVE_VALUES.DRAGON.elder : this.OBJECTIVE_VALUES.DRAGON.base;
    
    const evSecure = pSuccess * baseValue + (1 - pSuccess) * (-0.08); // failure cost
    const evAvoid = 0.02; // small EV from playing safe
    
    const recommendation: RecommendationType = evSecure > evAvoid && pSuccess >= 0.6 ? 'SECURE' : 'AVOID';

    return {
      recommendation,
      confidence: Math.min(0.95, pSuccess),
      expectedValue: evSecure,
      pSuccess,
      winProbDelta: pSuccess * baseValue * 100,
      rationale: this.buildRationale(state, recommendation),
      coachCall: recommendation === 'SECURE' ? 'Drake now' : 'Skip drake'
    };
  }

  public decideBaron(state: ObjectiveState): ObjectiveDecision {
    const pSuccess = this.calculatePSuccess(state);
    const baseValue = this.OBJECTIVE_VALUES.BARON;
    
    const evSecure = pSuccess * baseValue + (1 - pSuccess) * (-0.15); // Higher failure cost for Baron
    const evAvoid = 0.01;
    
    const recommendation: RecommendationType = evSecure > evAvoid && pSuccess >= 0.65 ? 'SECURE' : 'AVOID';

    return {
      recommendation,
      confidence: Math.min(0.95, pSuccess),
      expectedValue: evSecure,
      pSuccess,
      winProbDelta: pSuccess * baseValue * 100,
      rationale: this.buildRationale(state, recommendation),
      coachCall: recommendation === 'SECURE' ? 'Baron now' : 'Hold Baron'
    };
  }

  private calculatePSuccess(state: ObjectiveState): number {
    // Heuristic-based probability calculation as a fallback for the ML model
    let score = 0.5;

    // Numerical advantage
    score += (state.allyCountNear - state.enemyCountNear) * 0.1;

    // Vision control
    score += (state.visionInPit - state.enemyVisionInPit) * 0.05;

    // Resources
    if (state.smiteReady && !state.enemySmiteReady) score += 0.15;
    if (!state.smiteReady && state.enemySmiteReady) score -= 0.15;

    // Ultimates
    score += (state.ultimatesUp - state.enemyUltimatesUp) * 0.04;

    // Health
    score += (state.playerHpPercent - 50) / 100;

    return Math.max(0.05, Math.min(0.95, score));
  }

  private buildRationale(state: ObjectiveState, rec: RecommendationType): string[] {
    const rationale: string[] = [];
    if (state.allyCountNear > state.enemyCountNear) rationale.push('Numerical advantage near pit');
    if (state.visionInPit > state.enemyVisionInPit) rationale.push('Superior vision control');
    if (state.smiteReady) rationale.push('Smite is available');
    if (state.ultimatesUp > state.enemyUltimatesUp) rationale.push('Ultimate advantage');
    if (rec === 'AVOID' && state.enemyCountNear > state.allyCountNear) rationale.push('Risk of being outnumbered');
    return rationale;
  }
}
