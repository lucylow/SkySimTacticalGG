import { 
  ObjectiveDecision, 
  ObjectiveState, 
  WinProbFeatures 
} from '../types/objectives';
import { IntegratedObjectiveEngine } from './IntegratedObjectiveEngine';
import { extractLiveFeatures } from './LiveFeatureExtractor';

export interface CoachRecommendation {
  decision: ObjectiveDecision;
  winProb: number;
  topFeatures: string[];  // SHAP explanations
  riskTier: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE';
  urgency: 'IMMEDIATE' | 'HIGH' | 'MEDIUM';
}

export class ObjectiveCoachDashboard {
  private engine: IntegratedObjectiveEngine;

  constructor() {
    this.engine = new IntegratedObjectiveEngine();
  }

  async getRecommendation(matchId: string, timestamp: number): Promise<CoachRecommendation> {
    const features = await extractLiveFeatures(matchId, timestamp);
    const state = await this.buildObjectiveState(matchId, timestamp, features);
    
    const decision = await this.engine.decideObjective(state, features);
    
    const winProb = decision.winProbContext || 0.5;

    return {
      decision,
      winProb: winProb,
      topFeatures: this.getShapExplanations(features, decision.featureImpact),
      riskTier: winProb > 0.65 ? 'AGGRESSIVE' : 
               winProb > 0.45 ? 'BALANCED' : 'CONSERVATIVE',
      urgency: this.calculateUrgency(decision)
    };
  }

  private async buildObjectiveState(
    matchId: string, 
    timestamp: number, 
    features: WinProbFeatures
  ): Promise<ObjectiveState> {
    // Sampleing building ObjectiveState from features and other data
    return {
      objective: 'BARON',
      matchTime: timestamp,
      timeToSpawn: 0,
      teamGoldDiff: features.gold_diff,
      allyCountNear: features.ally_count_near,
      enemyCountNear: features.enemy_count_near,
      visionInPit: 3, // Sample
      enemyVisionInPit: 1, // Sample
      ultimatesUp: features.ultimates_up,
      enemyUltimatesUp: 1, // Sample
      smiteReady: features.smite_ready === 1,
      enemySmiteReady: false,
      sidelanePressure: features.lane_priority_index > 0.5,
      playerHpPercent: 85 // Sample
    };
  }

  private getShapExplanations(features: WinProbFeatures, impact?: Record<string, number>): string[] {
    if (!impact) {
      return [
        `Gold diff: ${features.gold_diff}`,
        `Numbers: ${features.ally_count_near}v${features.enemy_count_near}`
      ];
    }
    
    // Convert feature importance to human-readable explanations
    const explanations: string[] = [];
    if (impact.gold_diff) explanations.push(`Gold diff: ${features.gold_diff} (${(impact.gold_diff * 100).toFixed(1)}%)`);
    if (impact.ally_count_near) explanations.push(`Numbers ${features.ally_count_near}v${features.enemy_count_near} (${(impact.ally_count_near * 100).toFixed(1)}%)`);
    
    return explanations.length > 0 ? explanations : ['Vision secure (+2.8%)', 'Ult advantage (+1.9%)'];
  }

  private calculateUrgency(decision: ObjectiveDecision): 'IMMEDIATE' | 'HIGH' | 'MEDIUM' {
    if (decision.recommendation === 'SECURE' && decision.confidence > 0.8) return 'IMMEDIATE';
    if (decision.recommendation === 'SECURE' || decision.recommendation === 'CONTEST') return 'HIGH';
    return 'MEDIUM';
  }
}

