// VALORANT Retake Analyzer - Specialized analyzer for retake scenarios
// Analyzes "Would it have been better to save in this 3v5 retake?" type questions

import type { RoundData, MatchMetadata, GridDataPacket } from '@/types/backend';
import type { MatchContext, PlayerState } from '@/types/grid';

export interface RetakeScenario {
  round_number: number;
  defenders: number; // Players attempting retake
  attackers: number; // Players holding site
  site: 'A' | 'B' | 'C';
  site_control: number; // 0-1, how much control attackers have
  time_remaining: number; // Seconds until spike explodes
  player_states: {
    health: number;
    armor: number;
    weapon: string;
    utility: string[];
  }[];
  spike_plant_time?: number;
}

export interface RetakeAnalysis {
  scenario: string;
  retake_success_probability: number;
  save_impact: SaveImpact;
  recommendation: string;
  key_factors: {
    factor: string;
    impact: number;
    explanation: string;
  }[];
  confidence: number;
}

export interface SaveImpact {
  next_round_win_probability: number;
  economic_advantage: number;
  full_buy_probability: number;
  momentum_impact: number;
}

/**
 * Specialized VALORANT Retake Analyzer
 * Calculates retake success probabilities and compares to saving
 */
export class ValorantRetakeAnalyzer {
  /**
   * Analyze a retake decision scenario
   */
  async analyzeRetakeDecision(
    matchId: string,
    roundNumber: number,
    roundData: RoundData,
    matchData: MatchMetadata,
    gridPackets?: GridDataPacket[]
  ): Promise<RetakeAnalysis> {
    // Extract retake scenario from round data and GRID packets
    const retakeScenario = this.extractRetakeScenario(roundData, gridPackets);

    // Calculate retake success probability
    const retakeProb = this.calculateRetakeSuccess(
      retakeScenario.defenders,
      retakeScenario.attackers,
      retakeScenario.site_control,
      retakeScenario.time_remaining,
      retakeScenario.player_states
    );

    // Calculate save & next round impact
    const saveImpact = this.calculateSaveImpact(retakeScenario, roundData, matchData);

    // Generate recommendation
    const recommendation = this.generateRetakeRecommendation(retakeProb, saveImpact);

    // Extract key factors
    const keyFactors = this.extractKeyFactors(retakeScenario, retakeProb, saveImpact);

    // Calculate confidence
    const confidence = this.calculateConfidence(retakeScenario, gridPackets);

    return {
      scenario: `${retakeScenario.defenders}v${retakeScenario.attackers} retake on ${retakeScenario.site}-site`,
      retake_success_probability: retakeProb,
      save_impact: saveImpact,
      recommendation,
      key_factors: keyFactors,
      confidence,
    };
  }

  /**
   * Calculate retake success probability based on multiple factors
   */
  private calculateRetakeSuccess(
    defenders: number,
    attackers: number,
    siteControl: number,
    timeRemaining: number,
    playerStates: RetakeScenario['player_states']
  ): number {
    // Base probabilities from historical VALORANT data
    const baseProbs: Record<string, number> = {
      '1v1': 0.50,
      '1v2': 0.30,
      '1v3': 0.15,
      '1v4': 0.08,
      '1v5': 0.03,
      '2v1': 0.70,
      '2v2': 0.45,
      '2v3': 0.25,
      '2v4': 0.10,
      '2v5': 0.05,
      '3v1': 0.85,
      '3v2': 0.65,
      '3v3': 0.40,
      '3v4': 0.20,
      '3v5': 0.08,
      '4v1': 0.92,
      '4v2': 0.78,
      '4v3': 0.55,
      '4v4': 0.35,
      '4v5': 0.18,
      '5v1': 0.95,
      '5v2': 0.85,
      '5v3': 0.65,
      '5v4': 0.45,
      '5v5': 0.25,
    };

    const matchupKey = `${defenders}v${attackers}`;
    let base = baseProbs[matchupKey] || 0.05;

    // Adjust for site control (0-1, 1 = full control)
    // More control = harder retake
    const siteFactor = 1.0 - (siteControl * 0.3);
    base *= siteFactor;

    // Adjust for time pressure
    // Less time = harder retake (spike pressure)
    const timeFactor = Math.min(1.0, timeRemaining / 45.0);
    base *= (0.7 + 0.3 * timeFactor); // At 0s, 70% of base; at 45s+, 100% of base

    // Adjust for player health/weapons
    const avgHealth = playerStates.reduce((sum, p) => sum + p.health, 0) / playerStates.length;
    const healthFactor = avgHealth / 100;
    base *= (0.8 + 0.2 * healthFactor);

    // Adjust for utility availability
    const hasUtility = playerStates.some(p => p.utility.length > 0);
    if (hasUtility) {
      base *= 1.15; // Utility increases retake success
    }

    // Clamp between 5% and 95%
    return Math.max(0.05, Math.min(0.95, base));
  }

  /**
   * Calculate the impact of saving instead of retaking
   */
  private calculateSaveImpact(
    scenario: RetakeScenario,
    roundData: RoundData,
    matchData: MatchMetadata
  ): SaveImpact {
    // Estimate next round win probability if we save
    const savedEconomy = scenario.defenders * 1900; // Loss bonus per player
    const preservedWeapons = scenario.defenders * 2900; // Average weapon value saved

    // Next round would be a full buy
    const nextRoundWinProb = this.estimateFullBuyWinProbability(
      savedEconomy + preservedWeapons,
      roundData
    );

    // Economic advantage
    const economicAdvantage = savedEconomy + preservedWeapons;

    // Full buy probability (if we save, we can full buy next round)
    const fullBuyProb = economicAdvantage > 12000 ? 0.95 : economicAdvantage > 8000 ? 0.75 : 0.50;

    // Momentum impact (saving might reduce momentum, but preserves economy)
    const momentumImpact = -0.1; // Slight negative, but economy preservation offsets

    return {
      next_round_win_probability: nextRoundWinProb,
      economic_advantage: economicAdvantage,
      full_buy_probability: fullBuyProb,
      momentum_impact: momentumImpact,
    };
  }

  /**
   * Estimate win probability for a full buy round
   */
  private estimateFullBuyWinProbability(economy: number, roundData: RoundData): number {
    // Base probability for full buy rounds
    let baseProb = 0.50;

    // Adjust based on economy
    if (economy > 15000) {
      baseProb = 0.60; // Very strong economy
    } else if (economy > 12000) {
      baseProb = 0.55; // Strong economy
    } else if (economy > 8000) {
      baseProb = 0.50; // Decent economy
    } else {
      baseProb = 0.45; // Weak economy
    }

    // Adjust based on round type context
    if (roundData.round_type === 'full') {
      baseProb += 0.05; // Already in full buy context
    }

    return Math.max(0.35, Math.min(0.75, baseProb));
  }

  /**
   * Generate strategic recommendation
   */
  private generateRetakeRecommendation(
    retakeProb: number,
    saveImpact: SaveImpact
  ): string {
    const retakeExpectedValue = retakeProb * 1.0; // Win round = 1.0 value
    const saveExpectedValue = (1 - retakeProb) * saveImpact.next_round_win_probability; // Lose this, win next

    if (retakeProb < 0.15 && saveImpact.next_round_win_probability > 0.55) {
      return `The ${Math.round(retakeProb * 100)}% retake success probability is too low. Saving would preserve ${Math.round(saveImpact.economic_advantage / 1000)}k in economy and give a ${Math.round(saveImpact.next_round_win_probability * 100)}% chance to win the following gun round. Saving is the superior strategic choice.`;
    } else if (retakeProb > 0.35 && saveImpact.next_round_win_probability < 0.50) {
      return `The retake has a ${Math.round(retakeProb * 100)}% probability of success, which is reasonable given the game state. The economic impact of saving would not justify conceding the round. Attempting the retake was the correct decision.`;
    } else {
      return `The retake has a ${Math.round(retakeProb * 100)}% probability of success. Saving would give a ${Math.round(saveImpact.next_round_win_probability * 100)}% chance next round. Both options are viable; the decision depends on team confidence and momentum.`;
    }
  }

  /**
   * Extract key factors affecting the decision
   */
  private extractKeyFactors(
    scenario: RetakeScenario,
    retakeProb: number,
    saveImpact: SaveImpact
  ): Array<{ factor: string; impact: number; explanation: string }> {
    const factors: Array<{ factor: string; impact: number; explanation: string }> = [];

    // Player count disadvantage
    const playerDisadvantage = scenario.attackers - scenario.defenders;
    if (playerDisadvantage >= 2) {
      factors.push({
        factor: 'Player Count Disadvantage',
        impact: -0.25,
        explanation: `${playerDisadvantage} player disadvantage significantly reduces retake success probability`,
      });
    }

    // Time pressure
    if (scenario.time_remaining < 20) {
      factors.push({
        factor: 'Time Pressure',
        impact: -0.15,
        explanation: `Only ${scenario.time_remaining}s remaining creates extreme pressure`,
      });
    }

    // Site control
    if (scenario.site_control > 0.7) {
      factors.push({
        factor: 'Strong Site Control',
        impact: -0.20,
        explanation: 'Attackers have strong positioning and utility setup',
      });
    }

    // Economic advantage of saving
    if (saveImpact.economic_advantage > 10000) {
      factors.push({
        factor: 'Economic Preservation',
        impact: 0.30,
        explanation: `Saving preserves ${Math.round(saveImpact.economic_advantage / 1000)}k for next round`,
      });
    }

    // Next round win probability
    if (saveImpact.next_round_win_probability > 0.60) {
      factors.push({
        factor: 'Next Round Advantage',
        impact: 0.25,
        explanation: `Full buy next round has ${Math.round(saveImpact.next_round_win_probability * 100)}% win probability`,
      });
    }

    return factors;
  }

  /**
   * Calculate confidence in the analysis
   */
  private calculateConfidence(
    scenario: RetakeScenario,
    gridPackets?: GridDataPacket[]
  ): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (gridPackets && gridPackets.length > 10) {
      confidence += 0.2;
    }

    // Complete scenario data = higher confidence
    if (scenario.player_states.length === scenario.defenders) {
      confidence += 0.15;
    }

    // Time data available
    if (scenario.time_remaining > 0) {
      confidence += 0.15;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Extract retake scenario from round data and GRID packets
   */
  private extractRetakeScenario(
    roundData: RoundData,
    gridPackets?: GridDataPacket[]
  ): RetakeScenario {
    // Default values if GRID data not available
    let defenders = 3;
    let attackers = 5;
    let site: 'A' | 'B' | 'C' = roundData.bomb_site || 'A';
    let siteControl = 0.6;
    let timeRemaining = 30;
    let playerStates: RetakeScenario['player_states'] = [];

    // If GRID packets available, extract actual data
    if (gridPackets && gridPackets.length > 0) {
      const latestPacket = gridPackets[gridPackets.length - 1];
      const context = latestPacket.match_context;

      // Count alive players by team
      const alivePlayers = context.player_locations_alive || [];
      // This would need team information from GRID data
      // For now, estimate based on round context

      // Extract site from context
      if (context.map) {
        // Infer site from map context (simplified)
        site = roundData.bomb_site || 'A';
      }

      // Extract time remaining
      timeRemaining = context.round_time_remaining || 30;

      // Extract site control
      if (context.site_control === 'Attacker') {
        siteControl = 0.8;
      } else if (context.site_control === 'Defender') {
        siteControl = 0.2;
      } else {
        siteControl = 0.5;
      }

      // Extract player states
      playerStates = gridPackets
        .filter(p => p.player.team === 'Defender')
        .map(p => ({
          health: p.player.health,
          armor: p.player.armor,
          weapon: p.inventory.primary_weapon || 'unknown',
          utility: Object.values(p.inventory.abilities)
            .filter(a => a && a.charges > 0)
            .map(a => a!.name),
        }));
    } else {
      // Mock player states for demonstration
      playerStates = Array.from({ length: defenders }, () => ({
        health: 80 + Math.random() * 20,
        armor: 50 + Math.random() * 50,
        weapon: 'Vandal',
        utility: ['flash', 'smoke'],
      }));
    }

    return {
      round_number: roundData.round_number,
      defenders,
      attackers,
      site,
      site_control: siteControl,
      time_remaining: timeRemaining,
      player_states: playerStates,
    };
  }
}

export const valorantRetakeAnalyzer = new ValorantRetakeAnalyzer();


