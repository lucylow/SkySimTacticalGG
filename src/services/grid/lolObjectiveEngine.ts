import { ObjectiveDecision, ObjectiveState } from '@/types/grid';

export class LolObjectiveEngine {
  private readonly OBJECTIVE_VALUES = {
    DRAGON: { base: 0.06, elder: 0.15 },  // +6-15% win prob
    BARON: 0.12,                          // +12% avg
    HERALD: 0.04,                         // +4%
    TOWER: 0.03                           // +3% per outer
  };

  public decideDragon(state: ObjectiveState): ObjectiveDecision {
    const pSuccess = this.calculatePSuccess(state);
    const evSecure = pSuccess * (state.timeToSpawn > 1800 ? this.OBJECTIVE_VALUES.DRAGON.elder : this.OBJECTIVE_VALUES.DRAGON.base) + 
                    (1 - pSuccess) * (-0.08);  // failure cost
    
    const evAvoid = 0.02;  // small EV from playing safe
    
    const recommendation = evSecure > evAvoid && pSuccess >= 0.6 
      ? 'SECURE' : 'AVOID';

    return {
      recommendation,
      confidence: Math.min(0.95, pSuccess),
      expectedValue: evSecure,
      pSuccess,
      winProbDelta: pSuccess * this.OBJECTIVE_VALUES.DRAGON.base * 100,
      rationale: this.buildRationale(state, recommendation),
      coachCall: recommendation === 'SECURE' ? 'Drake now' : 'Skip drake'
    };
  }

  public decideBaron(state: ObjectiveState): ObjectiveDecision {
    if (state.matchTime < 1200) { // Too early
      return {
        recommendation: 'AVOID',
        confidence: 0.95,
        expectedValue: 0,
        pSuccess: 0,
        winProbDelta: 0,
        rationale: ['Too early (<20min)'],
        coachCall: 'Baron later'
      };
    }

    const numbersAdv = state.allyCountNear >= 4 && state.enemyCountNear <= 3;
    const visionSecure = state.visionInPit >= 3 && state.enemyVisionInPit <= 1;
    
    const pSuccess = this.calculateBaronPSuccess(state);
    const evSecure = pSuccess * this.OBJECTIVE_VALUES.BARON;
    
    const recommendation = (numbersAdv || visionSecure) && pSuccess >= 0.65
      ? 'SECURE' 
      : state.allyCountNear >= state.enemyCountNear ? 'CONTEST' : 'AVOID';

    return {
      recommendation,
      confidence: pSuccess,
      expectedValue: evSecure,
      pSuccess,
      winProbDelta: this.OBJECTIVE_VALUES.BARON * 100,
      rationale: this.buildBaronRationale(state, recommendation),
      coachCall: recommendation === 'SECURE' ? 'Baron start' : 'Baron risky'
    };
  }

  private calculatePSuccess(state: ObjectiveState): number {
    let score = 0;

    // Numbers advantage (25%)
    score += Math.max(0, (state.allyCountNear - state.enemyCountNear) * 0.125);
    
    // Vision control (20%)
    score += (state.visionInPit - state.enemyVisionInPit) * 0.1;
    
    // Gold advantage (15%)
    score += Math.max(-0.15, state.teamGoldDiff / 10000);
    
    // Ultimates (20%)
    score += (state.ultimatesUp - state.enemyUltimatesUp) * 0.1;
    
    // Smite edge (10%)
    if (state.smiteReady && !state.enemySmiteReady) score += 0.1;
    
    // Health/state (10%)
    score += state.playerHpPercent * 0.1;
    
    return Math.min(0.98, Math.max(0.02, 0.5 + score));
  }

  private calculateBaronPSuccess(state: ObjectiveState): number {
    // Baron is harder and more risky than dragon
    const basePSuccess = this.calculatePSuccess(state);
    return Math.max(0.02, basePSuccess - 0.1); 
  }

  private buildRationale(state: ObjectiveState, recommendation: string): string[] {
    const rationale: string[] = [];
    if (state.allyCountNear > state.enemyCountNear) rationale.push(`${state.allyCountNear}v${state.enemyCountNear} numerical advantage`);
    if (state.visionInPit > state.enemyVisionInPit) rationale.push(`Vision secure (${state.visionInPit}-${state.enemyVisionInPit})`);
    if (state.ultimatesUp > state.enemyUltimatesUp) rationale.push(`Ultimates +${state.ultimatesUp - state.enemyUltimatesUp} advantage`);
    if (state.sidelanePressure) rationale.push('Sidelanes pressured');
    if (state.smiteReady && !state.enemySmiteReady) rationale.push('Smite window control');
    
    if (recommendation === 'AVOID') {
      if (state.enemyCountNear > state.allyCountNear) rationale.push('Outnumbered');
      if (state.teamGoldDiff < -5000) rationale.push('Significant gold deficit');
      if (!state.smiteReady) rationale.push('Smite not ready');
    }
    
    return rationale;
  }

  private buildBaronRationale(state: ObjectiveState, recommendation: string): string[] {
    const rationale = this.buildRationale(state, recommendation);
    if (state.matchTime < 1200) rationale.push('Too early for Baron');
    return rationale;
  }
}
