import { 
  MinimapFrame, 
  SimulationResult, 
  ValorantRole, 
  TimeSformerPrediction, 
  OpponentAction,
  TrainingDrill
} from './types';
import { TimeSformerMinimap } from './TimeSformerMinimap';

export class TimeSformerWorstCaseSimulator {
  private minimapModel = new TimeSformerMinimap();

  constructor() {
    this.minimapModel.loadModel().catch(console.error);
  }

  async simulateValorantRound(
    role: ValorantRole, 
    minimapHistory: MinimapFrame[]
  ): Promise<SimulationResult> {
    
    // TimeSformer prediction
    const prediction = this.minimapModel.predict(minimapHistory);
    
    // Generate worst-case opponent response
    const opponentAction = this.generateOpponentAction(prediction, role);
    
    return {
      timestamp: minimapHistory.length > 0 ? minimapHistory[minimapHistory.length-1].timestamp : Date.now(),
      minimapPrediction: prediction,
      opponentAction,
      yourRecoveryScript: this.generateRecovery(role, prediction),
      trainingDrill: this.generateDrill(prediction),
      panicLevel: this.calculatePanic(prediction)
    };
  }

  private generateOpponentAction(prediction: TimeSformerPrediction, role: ValorantRole): OpponentAction {
    if (prediction.ambushRisk > 0.75) {
      return {
        type: 'lurk_kill',
        location: this.predictLurkSpot(role),
        agent: this.selectLurker(prediction),
        utilSupport: prediction.utilityDenial > 0.6
      };
    }
    
    if (prediction.enemyRotateProbability > 0.8) {
      return {
        type: 'rotate_ambush',
        targetSite: this.predictRotateTarget(role),
        timing: '0:45 round time',
        numbersAdvantage: true
      };
    }
    
    return {
      type: 'default_execute',
      utilPerfect: prediction.utilityDenial < 0.3
    };
  }

  private generateRecovery(role: ValorantRole, prediction: TimeSformerPrediction): string[] {
    const scripts: Record<string, string[]> = {
      DUELIST: [
        'Stop dry entry',
        `Lurk risk ${Math.round(prediction.ambushRisk*100)}% → play trade`,
        'Crossfires only',
        'Save pistol damage'
      ],
      CONTROLLER: [
        `Utility denial ${(prediction.utilityDenial*100).toFixed(0)}%`,
        'Smoke defensively only',
        'Sound positioning primary',
        'Delay team execute 15s'
      ],
      SENTINEL: [
        prediction.worstCaseAlert,
        'Anchor off-angles',
        '1v2 trade value',
        'Post-plant only if numbers even'
      ]
    };
    
    return scripts[role] || ['Slow down', 'Play default', 'Trust timers'];
  }

  private generateDrill(prediction: TimeSformerPrediction): TrainingDrill {
    if (prediction.ambushRisk > 0.75) {
      return {
        name: 'Lurk Detection Drill',
        scenario: 'Play anchor vs known lurker',
        focus: 'Sound + minimap prediction',
        successMetric: 'Detect lurk before first shot'
      };
    }
    
    return {
      name: 'Rotate Counter',
      scenario: 'Predict enemy site switch',
      focus: 'Minimap pattern recognition',
      successMetric: 'Pre-position for rotate 80%'
    };
  }

  private calculatePanic(prediction: TimeSformerPrediction): 'LOW' | 'MEDIUM' | 'HIGH' {
    const score = (prediction.ambushRisk + prediction.enemyRotateProbability + prediction.utilityDenial) / 3;
    if (score > 0.7) return 'HIGH';
    if (score > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private predictLurkSpot(role: ValorantRole): string {
    return role === 'SENTINEL' ? 'B Link' : 'A Main';
  }

  private selectLurker(prediction: TimeSformerPrediction): string {
    return 'Sova'; // Mocked
  }

  private predictRotateTarget(role: ValorantRole): string {
    return 'Site B'; // Mocked
  }
}
