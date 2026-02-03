import { describe, it, expect } from 'vitest';
import { LolObjectiveEngine } from '../LolObjectiveEngine';
import { ObjectiveState } from '../../types/objectives';

describe('LolObjectiveEngine', () => {
  const engine = new LolObjectiveEngine();

  it('should recommend SECURE for Baron given the example case', () => {
    // Match time: 28:30 (1710s)
    // Team gold diff: -900
    // Allies nearby: 4
    // Enemies: 2
    // Your ultimates up: 4; enemy ultimates up: 2
    // Smite: your jungler up; enemy smite down (Sampleing as smiteReady=true vs enemySmiteReady=false)
    // Vision in pit: 3 friendly, 0 enemy (issue says no enemy control wards)
    // Minion waves: top and mid pushing (sidelanePressure=true)
    const state: ObjectiveState = {
      objective: 'BARON',
      timeToSpawn: 0,
      matchTime: 1710,
      teamGoldDiff: -900,
      allyCountNear: 4,
      enemyCountNear: 2,
      visionInPit: 3,
      enemyVisionInPit: 0,
      ultimatesUp: 4,
      enemyUltimatesUp: 2,
      smiteReady: true,
      enemySmiteReady: false,
      sidelanePressure: true,
      playerHpPercent: 85,
    };

    const decision = engine.decideBaron(state);
    expect(decision.recommendation).toBe('SECURE');
    expect(decision.confidence).toBeGreaterThanOrEqual(0.65);
    expect(decision.coachCall).toBe('Baron start');
    expect(decision.rationale).toContain('4v2 numerical advantage');
    expect(decision.rationale).toContain('Ultimate advantage (+2)');
  });

  it('should recommend AVOID for Baron when too early', () => {
    const state: ObjectiveState = {
      objective: 'BARON',
      timeToSpawn: 0,
      matchTime: 600, // 10 mins
      teamGoldDiff: 0,
      allyCountNear: 5,
      enemyCountNear: 0,
      visionInPit: 5,
      enemyVisionInPit: 0,
      ultimatesUp: 5,
      enemyUltimatesUp: 0,
      smiteReady: true,
      enemySmiteReady: false,
      sidelanePressure: true,
      playerHpPercent: 100,
    };

    const decision = engine.decideBaron(state);
    expect(decision.recommendation).toBe('AVOID');
    expect(decision.coachCall).toBe('Wait Baron');
    expect(decision.rationale[0]).toMatch(/Too early/);
  });

  it('should recommend SECURE for Dragon with good conditions', () => {
    const state: ObjectiveState = {
      objective: 'DRAGON',
      timeToSpawn: 10,
      matchTime: 1200,
      teamGoldDiff: 1000,
      allyCountNear: 3,
      enemyCountNear: 2,
      visionInPit: 2,
      enemyVisionInPit: 1,
      ultimatesUp: 2,
      enemyUltimatesUp: 1,
      smiteReady: true,
      enemySmiteReady: true,
      sidelanePressure: false,
      playerHpPercent: 80,
    };

    const decision = engine.decideDragon(state);
    expect(decision.recommendation).toBe('SECURE');
    expect(decision.coachCall).toBe('Drake now');
  });

  it('should recommend AVOID for Dragon when outnumbered and behind', () => {
    const state: ObjectiveState = {
      objective: 'DRAGON',
      timeToSpawn: 5,
      matchTime: 1200,
      teamGoldDiff: -2000,
      allyCountNear: 2,
      enemyCountNear: 4,
      visionInPit: 1,
      enemyVisionInPit: 2,
      ultimatesUp: 1,
      enemyUltimatesUp: 3,
      smiteReady: true,
      enemySmiteReady: true,
      sidelanePressure: false,
      playerHpPercent: 60,
    };

    const decision = engine.decideDragon(state);
    expect(decision.recommendation).toBe('AVOID');
    expect(decision.coachCall).toBe('Skip drake');
  });

  it('should use Elder value for late game dragons', () => {
    const state: ObjectiveState = {
      objective: 'DRAGON',
      timeToSpawn: 0,
      matchTime: 2200, // > 35 mins
      teamGoldDiff: 0,
      allyCountNear: 5,
      enemyCountNear: 0,
      visionInPit: 3,
      enemyVisionInPit: 0,
      ultimatesUp: 5,
      enemyUltimatesUp: 0,
      smiteReady: true,
      enemySmiteReady: false,
      sidelanePressure: true,
      playerHpPercent: 100,
    };

    const decision = engine.decideDragon(state);
    expect(decision.coachCall).toBe('Elder now');
    // Elder base value is 0.15, Dragon is 0.06
    // With pSuccess near 1.0, winProbDelta should be near 15%
    expect(decision.winProbDelta).toBeGreaterThan(10);
  });
});

