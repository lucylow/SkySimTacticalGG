import { 
  FullGameState, 
  WinCondition, 
  CompArchetype, 
  Role, 
  RuneRecommendation, 
  ItemRecommendation, 
  EnemyThreat, 
  GamePhase, 
  StrategyOutput,
  Layer2Dynamic,
  Layer3Feedback
} from '../types/lolStrategy';
import { AgentInsight } from '../types/agents';

/**
 * WinConditionEngine
 * Detects the primary and secondary win conditions based on 3-layer game state.
 */
class WinConditionEngine {
  detectWinCondition(state: FullGameState): {
    primary: WinCondition;
    secondary: WinCondition;
    confidence: number;
  } {
    const scores: Record<WinCondition, number> = {
      earlySnowball: this.scoreEarlySnowball(state),
      frontToBack: this.scoreFrontToBack(state),
      pickComp: this.scorePickComp(state),
      splitPush: this.scoreSplitPush(state),
      objectiveStack: this.scoreObjectiveStack(state),
      lateScaling: this.scoreLateScaling(state)
    };

    const sortedConditions = (Object.entries(scores) as [WinCondition, number][])
      .sort((a, b) => b[1] - a[1]);

    return {
      primary: sortedConditions[0][0],
      secondary: sortedConditions[1][0],
      confidence: Math.min(0.99, sortedConditions[0][1])
    };
  }

  private scoreEarlySnowball(state: FullGameState): number {
    let score = 0;
    if (state.layer1.teamComp === 'engage') score += 0.3;
    score += (state.layer1.patchMeta.earlyPressure || 0);
    score += state.layer2.goldDiff / 5000;
    if (state.layer2.matchTime < 900) score += 0.2;
    return Math.max(0, score);
  }

  private scoreFrontToBack(state: FullGameState): number {
    let score = 0;
    if (state.layer1.teamComp === 'front2back') score += 0.4;
    score += state.layer2.visionScore / 100;
    if (state.layer2.matchTime > 1200) score += 0.2;
    return Math.max(0, score);
  }

  private scorePickComp(state: FullGameState): number {
    let score = 0;
    if (state.layer1.teamComp === 'pick') score += 0.5;
    score += state.layer2.visionScore / 80;
    if (state.layer3.adaptationSignals.includes('enemy_isolated')) score += 0.3;
    return Math.max(0, score);
  }

  private scoreSplitPush(state: FullGameState): number {
    let score = 0;
    if (state.layer1.teamComp === 'splitpush') score += 0.6;
    const highPriorityLanes = Object.values(state.layer2.lanePriority).filter(p => p > 0.5).length;
    score += highPriorityLanes * 0.1;
    return Math.max(0, score);
  }

  private scoreObjectiveStack(state: FullGameState): number {
    let score = 0;
    score += state.layer3.objectivesGained.filter(o => o.includes('dragon')).length * 0.2;
    if (state.layer2.objectiveTimers['dragon'] < 60) score += 0.2;
    return Math.max(0, score);
  }

  private scoreLateScaling(state: FullGameState): number {
    let score = 0;
    if (state.layer1.teamComp === 'scale') score += 0.5;
    score += (state.layer1.patchMeta.scalingValue || 0);
    if (state.layer2.matchTime > 1800) score += 0.3;
    return Math.max(0, score);
  }
}

/**
 * RuneEngine
 * Recommends runes based on win condition, team comp, and role.
 */
class RuneEngine {
  recommendRunes(state: FullGameState): RuneRecommendation {
    const winCon = new WinConditionEngine().detectWinCondition(state).primary;
    const role = state.layer1.role;
    
    const primaryRune = this.selectPrimaryRune(winCon, state.layer1.teamComp, role);
    const secondaryTree = this.selectSecondaryTree(state);
    
    return {
      primary: primaryRune,
      secondary: secondaryTree,
      shards: this.selectShards(role, state.layer1.enemyComp),
      rationale: this.buildRationale(winCon, primaryRune)
    };
  }

  private selectPrimaryRune(winCon: WinCondition, teamComp: CompArchetype, role: Role): string {
    const runeMap: Record<string, Record<string, string>> = {
      earlySnowball: { 
        TOP: 'Conqueror', JUNGLE: 'Electrocute', 
        MIDDLE: 'Electrocute', BOT: 'Hail of Blades', SUPPORT: 'Electrocute'
      },
      frontToBack: {
        TOP: 'Conqueror', JUNGLE: 'Aftershock', 
        MIDDLE: 'Phase Rush', BOT: 'Lethal Tempo', SUPPORT: 'Guardian'
      },
      pickComp: {
        TOP: 'Electrocute', JUNGLE: 'Dark Harvest',
        MIDDLE: 'Electrocute', BOT: 'Hail of Blades', SUPPORT: 'Glacial Augment'
      },
      splitPush: {
        TOP: 'Grasp of the Undying', JUNGLE: 'Fleet Footwork',
        MIDDLE: 'Phase Rush', BOT: 'Lethal Tempo', SUPPORT: 'Phase Rush'
      },
      objectiveStack: {
        TOP: 'Conqueror', JUNGLE: 'Aftershock',
        MIDDLE: 'Arcane Comet', BOT: 'Lethal Tempo', SUPPORT: 'Guardian'
      },
      lateScaling: {
        TOP: 'Grasp of the Undying', JUNGLE: 'Dark Harvest',
        MIDDLE: 'Arcane Comet', BOT: 'Lethal Tempo', SUPPORT: 'Gathering Storm'
      }
    };

    return runeMap[winCon]?.[role] || 'Conqueror';
  }

  private selectSecondaryTree(state: FullGameState): string {
    const enemyComp = state.layer1.enemyComp;
    if (enemyComp === 'engage' || enemyComp === 'pick') return 'Resolve (Survivability)';
    if (state.layer1.role === 'JUNGLE' || state.layer1.role === 'SUPPORT') return 'Inspiration (Utility)';
    return 'Sorcery (Scaling)';
  }

  private selectShards(role: Role, enemyComp: CompArchetype): string[] {
    const shards = ['Adaptive Force'];
    if (role === 'BOT' || role === 'JUNGLE') shards.push('Attack Speed');
    else shards.push('Adaptive Force');

    if (enemyComp === 'poke') shards.push('Health Scaling');
    else shards.push('Armor/MR');

    return shards;
  }

  private buildRationale(winCon: WinCondition, rune: string): string[] {
    return [
      `${rune} supports ${winCon} win condition`,
      `Optimal for ${winCon === 'earlySnowball' ? 'early pressure' : 'scaling into late game'}`
    ];
  }
}

/**
 * ItemEngine
 * Dynamically recommends builds based on game state and threats.
 */
class ItemEngine {
  recommendBuild(state: FullGameState): ItemRecommendation {
    const myChamp = state.layer1.myChamp;
    const enemyThreats = this.analyzeEnemyThreats(state.layer1.enemyComp);
    const gamePhase = this.getGamePhase(state.layer2.matchTime);
    
    return {
      mythic: this.selectMythic(state.layer1.role, enemyThreats, gamePhase),
      core1: this.selectCore1(state.layer1.role, state.layer2.goldDiff),
      core2: this.selectCore2(state.layer1.role, state.layer3.lastFightResult),
      situational: this.getSituationalItems(state.layer3, enemyThreats),
      pivotReason: this.buildPivotRationale(state)
    };
  }

  private analyzeEnemyThreats(enemyComp: CompArchetype): EnemyThreat[] {
    if (enemyComp === 'poke') return ['poke', 'burst'];
    if (enemyComp === 'engage') return ['cc', 'burst'];
    if (enemyComp === 'front2back') return ['tanks', 'dps'];
    return ['burst'];
  }

  private getGamePhase(time: number): GamePhase {
    if (time < 840) return 'EARLY';
    if (time < 1500) return 'MID';
    return 'LATE';
  }

  private selectMythic(role: Role, threats: EnemyThreat[], phase: GamePhase): string {
    if (role === 'BOT') {
      if (threats.includes('burst')) return 'Galeforce';
      if (threats.includes('tanks')) return 'Kraken Slayer';
      return 'Immortal Shieldbow';
    }
    if (role === 'TOP' || role === 'JUNGLE') {
      if (threats.includes('tanks')) return 'Divine Sunderer';
      return 'Goredrinker';
    }
    if (role === 'MIDDLE') {
      if (threats.includes('tanks')) return 'Liandry\'s Anguish';
      return 'Luden\'s Tempest';
    }
    return 'Locket of the Iron Solari';
  }

  private selectCore1(role: Role, goldDiff: number): string {
    return goldDiff > 1000 ? 'Offensive Core (Snowball)' : 'Standard Core';
  }

  private selectCore2(role: Role, lastFight: string): string {
    return lastFight === 'LOSS' ? 'Defensive/Utility Core' : 'Scaling Core';
  }

  private getSituationalItems(feedback: Layer3Feedback, threats: EnemyThreat[]): string[] {
    const items = [];
    if (threats.includes('cc')) items.push('Mercury\'s Treads');
    if (threats.includes('burst')) items.push('Zhonya\'s Hourglass / Guardian Angel');
    if (feedback.lastFightResult === 'LOSS') items.push('Stopwatch');
    return items;
  }

  private buildPivotRationale(state: FullGameState): string {
    if (state.layer3.lastFightResult === 'LOSS') return 'Pivoting to defensive options after lost fight';
    if (state.layer2.goldDiff > 2000) return 'Snowballing lead with aggressive items';
    return 'Standard build path for current game state';
  }
}

/**
 * StrategyEngine
 * Main engine that aggregates information into a full strategy.
 */
export class LolStrategyEngine {
  private winConEngine = new WinConditionEngine();
  private runeEngine = new RuneEngine();
  private itemEngine = new ItemEngine();

  generateStrategy(state: FullGameState): StrategyOutput {
    const winConData = this.winConEngine.detectWinCondition(state);
    const runes = this.runeEngine.recommendRunes(state);
    const build = this.itemEngine.recommendBuild(state);
    
    const strategy: StrategyOutput = {
      id: `strat-${Date.now()}`,
      agentId: 'lol-strategy-engine',
      timestamp: Date.now(),
      winCondition: winConData.primary,
      secondaryWinCondition: winConData.secondary,
      confidence: winConData.confidence,
      currentPriority: this.getImmediatePriority(state.layer2),
      mapPlan: this.generateMapPlan(state.layer2, winConData.primary),
      comms: this.generateComms(winConData.primary, state.layer2),
      adaptation: this.generateAdaptations(state.layer3),
      runes,
      build,
      insights: this.generateInsights(state, winConData.primary),
      recommendations: [
        `Focus on ${winConData.primary} as primary win condition`,
        `Immediate priority: ${this.getImmediatePriority(state.layer2)}`
      ],
      status: 'completed'
    };

    return strategy;
  }

  private getImmediatePriority(layer2: Layer2Dynamic): string {
    if (layer2.objectiveTimers['baron'] < 45 && layer2.matchTime > 1200) return 'BARON_SETUP';
    if (layer2.objectiveTimers['dragon'] < 45) return 'DRAGON_CONTROL';
    
    const midPriority = layer2.lanePriority['mid'] || 0;
    if (midPriority < -0.5) return 'DEFEND_MID';
    if (midPriority > 0.5) return 'PUSH_MID_PRIO';

    return 'FARM_AND_VISION';
  }

  private generateMapPlan(layer2: Layer2Dynamic, winCon: WinCondition): string[] {
    const plan = ['Establish vision in river'];
    if (winCon === 'splitPush') plan.push('Pressure side lanes opposite to active objective');
    if (winCon === 'pickComp') plan.push('Clear enemy vision in jungle corridors');
    if (layer2.objectiveTimers['dragon'] < 90) plan.push('Prepare for Dragon spawn');
    return plan;
  }

  private generateComms(winCon: WinCondition, layer2: Layer2Dynamic) {
    return {
      primary: winCon === 'frontToBack' ? 'Group for teamfight' : 'Avoid 5v5, look for picks',
      secondary: layer2.goldDiff > 0 ? 'Force objectives' : 'Play safe, wait for scaling',
      alerts: ['Check Baron vision', 'Enemy jungler missing']
    };
  }

  private generateAdaptations(layer3: Layer3Feedback): string[] {
    const adaptations = [...layer3.adaptationSignals];
    if (layer3.lastFightResult === 'LOSS') {
      adaptations.push('Stop contesting early objectives if outnumbered');
      adaptations.push('Wait for core item spikes before next major fight');
    }
    return adaptations;
  }

  private generateInsights(state: FullGameState, winCon: WinCondition): AgentInsight[] {
    return [
      {
        id: 'win-con-insight',
        type: 'strategy',
        title: `Primary Win Condition: ${winCon}`,
        description: `Based on team comps and current game state, ${winCon} is your best path to victory.`,
        severity: 0.9,
        actionable: true
      },
      {
        id: 'gold-insight',
        type: 'tactical',
        title: `Economy State: ${state.layer2.goldDiff > 0 ? 'Ahead' : 'Behind'}`,
        description: `Current gold difference is ${state.layer2.goldDiff}. Adjust aggression accordingly.`,
        severity: 0.7,
        actionable: false
      }
    ];
  }
}
