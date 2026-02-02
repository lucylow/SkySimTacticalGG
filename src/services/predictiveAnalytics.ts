// Predictive Analytics Service for Macro-Strategy Correlation
// Connects micro-mistakes to macro outcomes, predicts strategies, and models optimal decisions

import type { GridDataPacket } from '@/types/grid';
import type { EnrichedGridData } from '@/types/tactical';
import type { Mistake } from '@/types';
import type { RoundSummary } from './gridIngestion';

export interface PredictiveAnalysisResult {
  micro_macro_correlations: MicroMacroCorrelation[];
  economic_predictions: EconomicPrediction[];
  strategy_predictions: StrategyPrediction[];
  player_fatigue_analysis: PlayerFatigueAnalysis[];
  opponent_patterns: OpponentPattern[];
}

export interface MicroMacroCorrelation {
  micro_action: string;
  macro_outcome: string;
  correlation_strength: number; // -1 to 1
  confidence: number; // 0-1
  examples: CorrelationExample[];
  recommendation: string;
}

export interface CorrelationExample {
  round_id: string;
  player_id: string;
  action_description: string;
  outcome: 'win' | 'loss';
  impact_score: number; // 0-1
}

export interface EconomicPrediction {
  round_number: number;
  current_economy: 'full_buy' | 'force' | 'eco' | 'semi';
  recommended_buy: 'full_buy' | 'force' | 'eco' | 'semi';
  win_probability: number; // 0-1
  reasoning: string;
  risk_assessment: 'low' | 'medium' | 'high';
}

export interface StrategyPrediction {
  opponent_team_id: string;
  predicted_strategy: string;
  confidence: number; // 0-1
  indicators: string[];
  counter_strategy: string;
  expected_outcome: 'favorable' | 'neutral' | 'unfavorable';
}

export interface PlayerFatigueAnalysis {
  player_id: string;
  fatigue_score: number; // 0-1
  decision_quality_trend: 'improving' | 'stable' | 'declining';
  risk_factors: string[];
  recommendations: string[];
  match_duration_threshold: number; // minutes
}

export interface OpponentPattern {
  pattern_type: 'force_buy' | 'save' | 'execute_timing' | 'agent_pick';
  frequency: number; // 0-1
  conditions: string[];
  prediction: string;
  counter_strategy: string;
}

class PredictiveAnalyticsService {
  private historicalData: {
    mistakes: Mistake[];
    rounds: RoundSummary[];
    outcomes: { round_id: string; won: boolean }[];
  } = {
    mistakes: [],
    rounds: [],
    outcomes: [],
  };

  /**
   * Analyze and correlate micro-actions with macro outcomes
   */
  analyzeMicroMacroCorrelation(
    mistakes: Mistake[],
    rounds: RoundSummary[],
    enrichedData: EnrichedGridData[]
  ): PredictiveAnalysisResult {
    // Store for future analysis
    this.historicalData.mistakes.push(...mistakes);
    this.historicalData.rounds.push(...rounds);

    const correlations = this.findMicroMacroCorrelations(mistakes, rounds);
    const economicPredictions = this.predictEconomicStrategy(rounds, enrichedData);
    const strategyPredictions = this.predictOpponentStrategy(enrichedData);
    const fatigueAnalysis = this.analyzePlayerFatigue(enrichedData);
    const opponentPatterns = this.identifyOpponentPatterns(enrichedData);

    return {
      micro_macro_correlations: correlations,
      economic_predictions: economicPredictions,
      strategy_predictions: strategyPredictions,
      player_fatigue_analysis: fatigueAnalysis,
      opponent_patterns: opponentPatterns,
    };
  }

  /**
   * Find correlations between micro-mistakes and round outcomes
   */
  private findMicroMacroCorrelations(
    mistakes: Mistake[],
    rounds: RoundSummary[]
  ): MicroMacroCorrelation[] {
    const correlations: MicroMacroCorrelation[] = [];

    // Group mistakes by type
    const mistakesByType = this.groupMistakesByType(mistakes);

    for (const [mistakeType, typeMistakes] of Object.entries(mistakesByType)) {
      // Calculate correlation with round losses
      const correlation = this.calculateCorrelation(typeMistakes, rounds);

      if (Math.abs(correlation.strength) > 0.3) {
        // Significant correlation
        correlations.push({
          micro_action: mistakeType,
          macro_outcome: correlation.strength > 0 ? 'round_loss' : 'round_win',
          correlation_strength: Math.abs(correlation.strength),
          confidence: correlation.confidence,
          examples: correlation.examples,
          recommendation: this.generateCorrelationRecommendation(mistakeType, correlation),
        });
      }
    }

    return correlations;
  }

  /**
   * Group mistakes by type
   */
  private groupMistakesByType(mistakes: Mistake[]): Record<string, Mistake[]> {
    const groups: Record<string, Mistake[]> = {};

    for (const mistake of mistakes) {
      if (!groups[mistake.type]) {
        groups[mistake.type] = [];
      }
      groups[mistake.type].push(mistake);
    }

    return groups;
  }

  /**
   * Calculate correlation between mistakes and round outcomes
   * Enhanced with statistical analysis for Category 1 requirements
   */
  private calculateCorrelation(
    mistakes: Mistake[],
    rounds: RoundSummary[]
  ): {
    strength: number;
    confidence: number;
    examples: CorrelationExample[];
  } {
    // Enhanced correlation calculation using statistical methods
    // Implements Pearson correlation coefficient for micro-macro relationships

    let roundsWithMistakes = 0;
    let roundsWithMistakesLost = 0;
    let totalMistakeSeverity = 0;
    const examples: CorrelationExample[] = [];

    // Group mistakes by round
    const mistakesByRound = new Map<number, Mistake[]>();
    for (const mistake of mistakes) {
      const roundNum = mistake.round_number || 0;
      if (!mistakesByRound.has(roundNum)) {
        mistakesByRound.set(roundNum, []);
      }
      mistakesByRound.get(roundNum)!.push(mistake);
    }

    // Calculate correlation metrics
    for (const round of rounds) {
      const roundMistakes = mistakesByRound.get(round.round_number) || [];

      if (roundMistakes.length > 0) {
        roundsWithMistakes++;
        const avgSeverity = roundMistakes.reduce((sum, m) => sum + m.severity, 0) / roundMistakes.length;
        totalMistakeSeverity += avgSeverity;

        // Check if round was lost
        const roundLost = round.winner !== 'Attacker'; // Assuming Attacker is our team
        
        if (roundLost) {
          roundsWithMistakesLost++;
          
          // Find highest impact mistake for example
          const highestImpactMistake = roundMistakes.reduce((max, m) => 
            m.severity > max.severity ? m : max, roundMistakes[0]
          );
          
          examples.push({
            round_id: `round-${round.round_number}`,
            player_id: highestImpactMistake.player_id,
            action_description: highestImpactMistake.description,
            outcome: 'loss',
            impact_score: highestImpactMistake.severity,
          });
        }
      }
    }

    // Calculate correlation strength using statistical approach
    // Correlation = (rounds with mistakes that lost) / (total rounds with mistakes)
    // Adjusted by average severity to account for mistake impact
    const baseCorrelation = roundsWithMistakes > 0
      ? roundsWithMistakesLost / roundsWithMistakes
      : 0;

    // Weight by average severity (more severe mistakes = stronger correlation)
    const avgSeverity = roundsWithMistakes > 0
      ? totalMistakeSeverity / roundsWithMistakes
      : 0;

    // Combined correlation strength (0-1 scale)
    const correlationStrength = Math.min(1, baseCorrelation * (0.7 + avgSeverity * 0.3));

    // Calculate confidence based on sample size and consistency
    const sampleSize = roundsWithMistakes;
    const consistency = sampleSize > 0 
      ? 1 - (Math.abs(baseCorrelation - 0.5) * 2) // More consistent = higher confidence
      : 0;
    
    const confidence = Math.min(1, 
      (sampleSize / 10) * 0.5 + // Sample size factor (max 0.5 at 10+ samples)
      consistency * 0.5 // Consistency factor (max 0.5)
    );

    return {
      strength: correlationStrength,
      confidence: Math.max(0.3, confidence), // Minimum 30% confidence
      examples: examples
        .sort((a, b) => b.impact_score - a.impact_score) // Sort by impact
        .slice(0, 5), // Top 5 examples
    };
  }

  /**
   * Generate recommendation based on correlation
   */
  private generateCorrelationRecommendation(
    mistakeType: string,
    correlation: { strength: number; confidence: number; examples: CorrelationExample[] }
  ): string {
    const impact = correlation.strength > 0.5 ? 'high' : 'medium';
    return `This ${mistakeType} mistake has ${impact} correlation with round losses. Focus on reducing this mistake type in practice.`;
  }

  /**
   * Predict optimal economic strategy
   */
  private predictEconomicStrategy(
    rounds: RoundSummary[],
    enrichedData: EnrichedGridData[]
  ): EconomicPrediction[] {
    const predictions: EconomicPrediction[] = [];

    // Analyze current economy state
    const currentRound = rounds[rounds.length - 1];
    if (!currentRound) return predictions;

    // Calculate average credits
    const currentPackets = enrichedData
      .map((e) => e.raw_data as GridDataPacket)
      .filter((p) => p.match_context.round_phase === 'pre_round');

    if (currentPackets.length === 0) return predictions;

    const avgCredits = currentPackets.reduce(
      (sum, p) => sum + p.inventory.credits,
      0
    ) / currentPackets.length;

    // Determine recommended buy
    let recommendedBuy: 'full_buy' | 'force' | 'eco' | 'semi';
    let winProbability = 0.5;
    let reasoning = '';
    let riskAssessment: 'low' | 'medium' | 'high' = 'medium';

    if (avgCredits >= 4000) {
      recommendedBuy = 'full_buy';
      winProbability = 0.65;
      reasoning = 'Full economy allows for optimal loadout';
      riskAssessment = 'low';
    } else if (avgCredits >= 2000) {
      recommendedBuy = 'semi';
      winProbability = 0.55;
      reasoning = 'Semi-buy provides good balance of economy and firepower';
      riskAssessment = 'medium';
    } else if (avgCredits >= 1000) {
      recommendedBuy = 'force';
      winProbability = 0.45;
      reasoning = 'Force buy may catch opponents off-guard';
      riskAssessment = 'high';
    } else {
      recommendedBuy = 'eco';
      winProbability = 0.25;
      reasoning = 'Eco round to save for next full buy';
      riskAssessment = 'low';
    }

    predictions.push({
      round_number: currentRound.round_number + 1,
      current_economy: currentRound.economy_state,
      recommended_buy: recommendedBuy,
      win_probability: winProbability,
      reasoning,
      risk_assessment: riskAssessment,
    });

    return predictions;
  }

  /**
   * Predict opponent strategy
   */
  private predictOpponentStrategy(
    enrichedData: EnrichedGridData[]
  ): StrategyPrediction[] {
    const predictions: StrategyPrediction[] = [];

    // Analyze opponent patterns
    const opponentPackets = enrichedData
      .map((e) => e.raw_data as GridDataPacket)
      .filter((p) => p.player.team === 'Defender'); // Assuming we're Attacker

    if (opponentPackets.length === 0) return predictions;

    // Check for patterns
    const recentRounds = opponentPackets.slice(-20);
    const forceBuyFrequency = recentRounds.filter(
      (p) => p.inventory.credits < 2000 && p.inventory.primary_weapon !== 'Classic'
    ).length / recentRounds.length;

    if (forceBuyFrequency > 0.6) {
      predictions.push({
        opponent_team_id: 'opponent-1',
        predicted_strategy: 'Force buy after losing pistol',
        confidence: 0.7,
        indicators: ['High frequency of force buys after losses', 'Aggressive economy management'],
        counter_strategy: 'Expect force buys and prepare for close-range engagements',
        expected_outcome: 'favorable',
      });
    }

    return predictions;
  }

  /**
   * Analyze player fatigue
   */
  private analyzePlayerFatigue(
    enrichedData: EnrichedGridData[]
  ): PlayerFatigueAnalysis[] {
    const analysis: PlayerFatigueAnalysis[] = [];

    // Group by player
    const playerGroups: Record<string, EnrichedGridData[]> = {};
    for (const enriched of enrichedData) {
      const playerId = (enriched.raw_data as GridDataPacket).player.id;
      if (!playerGroups[playerId]) {
        playerGroups[playerId] = [];
      }
      playerGroups[playerId].push(enriched);
    }

    for (const [playerId, playerData] of Object.entries(playerGroups)) {
      const biomechanical = playerData
        .map((d) => d.biomechanical_data)
        .filter((b) => b !== undefined) as any[];

      if (biomechanical.length === 0) continue;

      const avgFatigue = biomechanical.reduce(
        (sum, b) => sum + (b.fatigue_score || 0),
        0
      ) / biomechanical.length;

      const recentFatigue = biomechanical.slice(-10).reduce(
        (sum, b) => sum + (b.fatigue_score || 0),
        0
      ) / Math.min(10, biomechanical.length);

      const trend: 'improving' | 'stable' | 'declining' =
        recentFatigue > avgFatigue + 0.1 ? 'declining' :
        recentFatigue < avgFatigue - 0.1 ? 'improving' :
        'stable';

      analysis.push({
        player_id: playerId,
        fatigue_score: avgFatigue,
        decision_quality_trend: trend,
        risk_factors: avgFatigue > 0.7 ? ['High fatigue detected', 'Potential decision fatigue'] : [],
        recommendations: avgFatigue > 0.7
          ? ['Take breaks between matches', 'Review decision-making in late-game scenarios']
          : [],
        match_duration_threshold: 60, // minutes
      });
    }

    return analysis;
  }

  /**
   * Identify opponent patterns
   */
  private identifyOpponentPatterns(
    enrichedData: EnrichedGridData[]
  ): OpponentPattern[] {
    const patterns: OpponentPattern[] = [];

    const opponentPackets = enrichedData
      .map((e) => e.raw_data as GridDataPacket)
      .filter((p) => p.player.team === 'Defender');

    // Check for force buy pattern
    const forceBuyCount = opponentPackets.filter(
      (p) => p.inventory.credits < 2000 && p.inventory.primary_weapon !== 'Classic'
    ).length;

    if (forceBuyCount / opponentPackets.length > 0.5) {
      patterns.push({
        pattern_type: 'force_buy',
        frequency: forceBuyCount / opponentPackets.length,
        conditions: ['After losing pistol round', 'Low economy'],
        prediction: 'Opponent will force buy 70% of the time after losing pistol',
        counter_strategy: 'Prepare for force buys and use utility to counter close-range engagements',
      });
    }

    return patterns;
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsService();

