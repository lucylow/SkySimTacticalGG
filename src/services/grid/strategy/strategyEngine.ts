import { GridMockData, StrategyOutput } from './types';
import { WinConditionEngine } from './winConditionEngine';
import { RuneEngine } from './runeEngine';
import { ItemEngine } from './itemEngine';

export class StrategyEngine {
  private winConEngine = new WinConditionEngine();
  private runeEngine = new RuneEngine();
  private itemEngine = new ItemEngine();

  generateStrategy(gridData: GridMockData): StrategyOutput {
    const winCon = this.winConEngine.detectWinCondition(gridData);
    const runes = this.runeEngine.recommendRunes(gridData, 'TOP');
    const build = this.itemEngine.recommendBuild(gridData, gridData.layer1.myChamp);

    let currentPriority = 'OBJECTIVE_CONTROL';
    let mapPlan = ['Vision', 'Group', 'Objective'];
    let primaryComm = 'Play for objectives';
    let signals: string[] = [];

    // Logic based on match state
    if (gridData.layer2.objectiveTimers.baron < 180) {
      currentPriority = 'BARON_SETUP';
      mapPlan = ['Vision baron pit', 'Group mid', 'Baron secure', 'Bot T2'];
      primaryComm = 'Baron vision';
      signals.push('Mid group', 'Peel carries');
    }

    // Feedback adaptations (Layer 3)
    if (gridData.layer3.lastFightResult === 'WIN') {
      signals.push('PRESS_ADVANTAGE');
    }
    if (gridData.layer3.objectivesGained.includes('herald')) {
      signals.push('TOP_PRESSURE');
    }
    if (gridData.layer2.visionScore < 20) {
      signals.push('VISION_FIRST');
    }

    return {
      currentPriority,
      mapPlan,
      comms: {
        primary: primaryComm,
        signals
      },
      winCondition: winCon,
      runes,
      build
    };
  }
}
