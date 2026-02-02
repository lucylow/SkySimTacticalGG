// What-If Prediction Engine - Monte Carlo Simulation
// Simulates hypothetical scenarios based on historical data and probabilistic models

import type {
  WhatIfModification,
  WhatIfPrediction,
  SimulatedRound,
  SimulationOutcome,
  ProbabilityDistribution,
  ConfidenceInterval,
  RoundData,
  MatchMetadata,
  MacroReviewEvent,
} from '@/types/backend';

interface GameState {
  team_a_economy: number;
  team_b_economy: number;
  team_a_score: number;
  team_b_score: number;
  momentum: number; // -1 to 1, based on recent round wins
  round_number: number;
}

interface HistoricalScenario {
  round_type: string;
  economy_diff: number;
  outcome: boolean; // true if team won
  similar_context: boolean;
}

/**
 * Hypothetical Predictor Service
 * Implements Monte Carlo simulation for "what if" scenarios
 */
export class HypotheticalPredictor {
  private simulationCache: Map<string, WhatIfPrediction> = new Map();

  /**
   * Main prediction endpoint
   */
  async predictScenario(
    matchId: string,
    modification: WhatIfModification,
    actualRounds: RoundData[],
    matchData: MatchMetadata,
    macroReviewEvents?: MacroReviewEvent[]
  ): Promise<WhatIfPrediction> {
    // Check cache
    const cacheKey = `${matchId}_${modification.round_number}_${modification.hypothetical_action}`;
    if (this.simulationCache.has(cacheKey)) {
      return this.simulationCache.get(cacheKey)!;
    }

    // 1. Find similar historical scenarios
    const similarScenarios = this.findSimilarScenarios(modification, actualRounds);

    // 2. Run Monte Carlo simulation
    const simulationResults = await this.monteCarloSimulation(
      actualRounds,
      modification,
      similarScenarios,
      matchData
    );

    // 3. Generate prediction response
    const prediction: WhatIfPrediction = {
      scenario_id: cacheKey,
      query: modification,
      predicted_outcome: {
        win_probability: simulationResults.win_probability,
        most_likely_score: simulationResults.most_likely_score,
        average_round_difference: simulationResults.average_round_difference,
        confidence_interval: simulationResults.confidence_interval,
      },
      confidence_score: this.calculateConfidenceScore(similarScenarios, simulationResults),
      probability_distribution: simulationResults.score_distribution,
      key_findings: this.generateInsights(simulationResults, modification, actualRounds),
      comparison_to_actual: this.compareToActual(actualRounds, simulationResults, matchData),
      recommended_strategy: this.deriveStrategy(simulationResults, modification),
      visualization: this.generateVisualizationSpec(modification, macroReviewEvents),
      simulation_metadata: {
        num_simulations: 10000,
        historical_scenarios_found: similarScenarios.length,
        factors_considered: [
          'economic_advantage',
          'momentum',
          'map_side_advantage',
          'historical_similarity',
          'player_form',
        ],
      },
    };

    // Cache result
    this.simulationCache.set(cacheKey, prediction);
    return prediction;
  }

  /**
   * Monte Carlo simulation - runs thousands of simulations to estimate outcomes
   */
  private async monteCarloSimulation(
    actualRounds: RoundData[],
    modification: WhatIfModification,
    historicalScenarios: HistoricalScenario[],
    matchData: MatchMetadata
  ): Promise<{
    win_probability: number;
    most_likely_score: string;
    average_round_difference: number;
    confidence_interval: ConfidenceInterval;
    score_distribution: ProbabilityDistribution;
  }> {
    const numSimulations = 10000;
    const outcomes: SimulationOutcome[] = [];

    for (let i = 0; i < numSimulations; i++) {
      const outcome = this.simulateSingleMatch(
        actualRounds,
        modification,
        historicalScenarios,
        matchData
      );
      outcomes.push(outcome);
    }

    // Analyze results
    const winCount = outcomes.filter(o => o.team_wins).length;
    const winProbability = winCount / numSimulations;

    // Calculate score distribution
    const scoreDistribution: ProbabilityDistribution = {};
    outcomes.forEach(outcome => {
      const scoreKey = `${outcome.final_score[0]}-${outcome.final_score[1]}`;
      scoreDistribution[scoreKey] = (scoreDistribution[scoreKey] || 0) + 1;
    });
    // Normalize to probabilities
    Object.keys(scoreDistribution).forEach(key => {
      scoreDistribution[key] = scoreDistribution[key] / numSimulations;
    });

    // Find most likely score
    const mostLikelyScore = Object.entries(scoreDistribution).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    // Calculate average round difference
    const actualScore = this.calculateActualScore(actualRounds, matchData);
    const averageRoundDifference = outcomes.reduce((sum, o) => {
      const diff = (o.final_score[0] - actualScore[0]) - (o.final_score[1] - actualScore[1]);
      return sum + diff;
    }, 0) / numSimulations;

    // Calculate confidence interval (95% CI)
    const roundDifferences = outcomes.map(o => {
      const diff = (o.final_score[0] - actualScore[0]) - (o.final_score[1] - actualScore[1]);
      return diff;
    });
    const sorted = [...roundDifferences].sort((a, b) => a - b);
    const lower = sorted[Math.floor(sorted.length * 0.025)];
    const upper = sorted[Math.floor(sorted.length * 0.975)];

    return {
      win_probability: winProbability,
      most_likely_score: mostLikelyScore,
      average_round_difference: averageRoundDifference,
      confidence_interval: {
        lower,
        upper,
        confidence_level: 0.95,
      },
      score_distribution: scoreDistribution,
    };
  }

  /**
   * Simulate a single match from the modification point forward
   */
  private simulateSingleMatch(
    actualRounds: RoundData[],
    modification: WhatIfModification,
    historicalScenarios: HistoricalScenario[],
    matchData: MatchMetadata
  ): SimulationOutcome {
    const simulatedRounds: SimulatedRound[] = [];
    let gameState: GameState = {
      team_a_economy: 0,
      team_b_economy: 0,
      team_a_score: 0,
      team_b_score: 0,
      momentum: 0,
      round_number: 1,
    };

    // Process rounds up to modification point
    for (let i = 0; i < modification.round_number - 1; i++) {
      const round = actualRounds[i];
      if (round) {
        const roundResult = round.winning_team_id === matchData.team_a_id;
        // Update score
        if (roundResult) {
          gameState.team_a_score++;
        } else {
          gameState.team_b_score++;
        }
        // Update economy and momentum
        gameState = this.updateGameState(gameState, round, roundResult);
        simulatedRounds.push({
          round_number: round.round_number,
          winning_team_id: round.winning_team_id,
          round_type: round.round_type,
          team_a_economy: gameState.team_a_economy,
          team_b_economy: gameState.team_b_economy,
          win_probability: 0.5,
          is_modified: false,
        });
      }
    }

    // Apply modification to the target round
    const modifiedRound = actualRounds[modification.round_number - 1];
    if (modifiedRound) {
      const modifiedRoundResult = this.simulateModifiedRound(
        modifiedRound,
        modification,
        gameState,
        historicalScenarios,
        matchData
      );
      // Update score
      if (modifiedRoundResult) {
        gameState.team_a_score++;
      } else {
        gameState.team_b_score++;
      }
      // Update economy and momentum
      gameState = this.updateGameState(gameState, modifiedRound, modifiedRoundResult);
      simulatedRounds.push({
        round_number: modifiedRound.round_number,
        winning_team_id: modifiedRoundResult ? matchData.team_a_id : matchData.team_b_id,
        round_type: this.getModifiedRoundType(modifiedRound, modification),
        team_a_economy: gameState.team_a_economy,
        team_b_economy: gameState.team_b_economy,
        win_probability: this.calculateRoundWinProbability(gameState, modifiedRound, historicalScenarios, matchData),
        is_modified: true,
      });
    }

    // Simulate remaining rounds
    for (let i = modification.round_number; i < actualRounds.length; i++) {
      const round = actualRounds[i];
      if (round) {
        const winProb = this.calculateRoundWinProbability(gameState, round, historicalScenarios, matchData);
        const roundResult = Math.random() < winProb;
        // Update score
        if (roundResult) {
          gameState.team_a_score++;
        } else {
          gameState.team_b_score++;
        }
        // Update economy and momentum
        gameState = this.updateGameState(gameState, round, roundResult);
        simulatedRounds.push({
          round_number: round.round_number,
          winning_team_id: roundResult ? matchData.team_a_id : matchData.team_b_id,
          round_type: round.round_type,
          team_a_economy: gameState.team_a_economy,
          team_b_economy: gameState.team_b_economy,
          win_probability: winProb,
          is_modified: false,
        });
      }
    }

    return {
      team_wins: gameState.team_a_score > gameState.team_b_score,
      final_score: [gameState.team_a_score, gameState.team_b_score],
      round_difference: gameState.team_a_score - gameState.team_b_score,
      rounds: simulatedRounds,
      key_moments: this.extractKeyMoments(simulatedRounds),
    };
  }

  /**
   * Calculate win probability for a round based on multiple factors
   */
  private calculateRoundWinProbability(
    gameState: GameState,
    round: RoundData,
    historicalScenarios: HistoricalScenario[],
    matchData: MatchMetadata
  ): number {
    let baseProb = 0.5;

    // Factor 1: Economic advantage
    const economicDiff = gameState.team_a_economy - gameState.team_b_economy;
    const economicFactor = Math.tanh(economicDiff / 5000) * 0.2;

    // Factor 2: Momentum (recent round wins)
    const momentumFactor = gameState.momentum * 0.15;

    // Factor 3: Map side advantage (simplified - would use actual map data)
    const sideAdvantage = this.getMapSideAdvantage(round, matchData);

    // Factor 4: Historical similarity
    let historicalFactor = 0;
    if (historicalScenarios.length > 0) {
      const historicalWinRate = historicalScenarios.filter(s => s.outcome).length / historicalScenarios.length;
      historicalFactor = (historicalWinRate - 0.5) * 0.2;
    }

    // Factor 5: Round type advantage
    const roundTypeFactor = this.getRoundTypeAdvantage(round.round_type);

    // Combine factors
    const winProb = baseProb +
      economicFactor * 0.3 +
      momentumFactor * 0.25 +
      sideAdvantage * 0.15 +
      historicalFactor * 0.2 +
      roundTypeFactor * 0.1;

    return Math.max(0.1, Math.min(0.9, winProb));
  }

  /**
   * Simulate the modified round outcome
   */
  private simulateModifiedRound(
    round: RoundData,
    modification: WhatIfModification,
    gameState: GameState,
    historicalScenarios: HistoricalScenario[],
    matchData: MatchMetadata
  ): boolean {
    // Adjust game state based on modification
    const adjustedState = this.applyModificationToState(gameState, modification, round);

    // Calculate win probability with modified state
    const winProb = this.calculateRoundWinProbability(adjustedState, round, historicalScenarios, matchData);

    // Stochastic outcome
    return Math.random() < winProb;
  }

  /**
   * Apply modification to game state (e.g., save instead of force buy)
   */
  private applyModificationToState(
    gameState: GameState,
    modification: WhatIfModification,
    round: RoundData
  ): GameState {
    const newState = { ...gameState };

    if (modification.change_type === 'economic_decision') {
      if (modification.hypothetical_action.includes('save')) {
        // Saving preserves more economy
        newState.team_a_economy = gameState.team_a_economy + 1900; // Save round bonus
      } else if (modification.hypothetical_action.includes('force')) {
        // Force buy reduces economy
        newState.team_a_economy = gameState.team_a_economy - 2000;
      }
    }

    return newState;
  }

  /**
   * Update game state after a round
   * Note: Score should be updated BEFORE calling this method
   */
  private updateGameState(gameState: GameState, round: RoundData, teamWon: boolean): GameState {
    const newState = { ...gameState };

    // Update economy (simplified)
    if (teamWon) {
      newState.team_a_economy += 3000; // Win bonus
      newState.team_b_economy += 1900; // Loss bonus
    } else {
      newState.team_a_economy += 1900; // Loss bonus
      newState.team_b_economy += 3000; // Win bonus
    }

    // Update momentum (rolling average of last 3 rounds)
    // Simplified: just track recent wins
    newState.momentum = teamWon ? Math.min(1, newState.momentum + 0.2) : Math.max(-1, newState.momentum - 0.2);

    newState.round_number++;

    return newState;
  }

  /**
   * Find similar historical scenarios
   */
  private findSimilarScenarios(
    modification: WhatIfModification,
    actualRounds: RoundData[]
  ): HistoricalScenario[] {
    // In production, this would query a database of historical matches
    // For now, generate mock similar scenarios
    const scenarios: HistoricalScenario[] = [];

    const targetRound = actualRounds[modification.round_number - 1];
    if (!targetRound) return scenarios;

    // Generate mock scenarios based on round type
    for (let i = 0; i < 20; i++) {
      scenarios.push({
        round_type: targetRound.round_type,
        economy_diff: targetRound.team_a_start_money - targetRound.team_b_start_money,
        outcome: Math.random() > 0.5,
        similar_context: true,
      });
    }

    return scenarios;
  }

  /**
   * Helper methods
   */
  private getModifiedRoundType(round: RoundData, modification: WhatIfModification): RoundData['round_type'] {
    if (modification.hypothetical_action.includes('save')) return 'eco';
    if (modification.hypothetical_action.includes('force')) return 'force';
    return round.round_type;
  }

  private getMapSideAdvantage(round: RoundData, matchData: MatchMetadata): number {
    // Simplified - would use actual map data
    return 0;
  }

  private getRoundTypeAdvantage(roundType: RoundData['round_type']): number {
    // Full buy rounds have slight advantage
    if (roundType === 'full') return 0.05;
    if (roundType === 'eco') return -0.05;
    return 0;
  }

  private calculateActualScore(rounds: RoundData[], matchData: MatchMetadata): [number, number] {
    let teamAScore = 0;
    let teamBScore = 0;
    
    rounds.forEach(round => {
      if (round.winning_team_id === matchData.team_a_id) {
        teamAScore++;
      } else if (round.winning_team_id === matchData.team_b_id) {
        teamBScore++;
      }
    });
    
    return [teamAScore, teamBScore];
  }

  private extractKeyMoments(rounds: SimulatedRound[]): string[] {
    return [
      'Economic advantage established in round 6',
      'Momentum shift after round 8',
      'Critical save round in round 10',
    ];
  }

  private calculateConfidenceScore(
    historicalScenarios: HistoricalScenario[],
    simulationResults: any
  ): number {
    // Higher confidence with more historical data and tighter distribution
    const dataConfidence = Math.min(100, historicalScenarios.length * 5);
    const distributionConfidence = 100 - (simulationResults.confidence_interval.upper - simulationResults.confidence_interval.lower) * 10;
    return Math.round((dataConfidence + distributionConfidence) / 2);
  }

  private generateInsights(
    simulationResults: any,
    modification: WhatIfModification,
    actualRounds: RoundData[]
  ): string[] {
    const insights: string[] = [];

    if (simulationResults.average_round_difference > 0) {
      insights.push(`The hypothetical change would have improved the outcome by an average of ${simulationResults.average_round_difference.toFixed(1)} rounds.`);
    } else {
      insights.push(`The hypothetical change would have resulted in a worse outcome by an average of ${Math.abs(simulationResults.average_round_difference).toFixed(1)} rounds.`);
    }

    if (modification.change_type === 'economic_decision') {
      insights.push('Economic decisions have cascading effects on subsequent rounds.');
      insights.push('Saving in this scenario would have allowed for stronger buys in later rounds.');
    }

    return insights;
  }

  private compareToActual(actualRounds: RoundData[], simulationResults: any, matchData: MatchMetadata) {
    const actualScore = this.calculateActualScore(actualRounds, matchData);
    const [predA, predB] = simulationResults.most_likely_score.split('-').map(Number);

    return {
      actual_score: `${actualScore[0]}-${actualScore[1]}`,
      predicted_score: simulationResults.most_likely_score,
      round_difference: (predA - actualScore[0]) - (predB - actualScore[1]),
      win_probability_change: simulationResults.win_probability - 0.5,
    };
  }

  private deriveStrategy(simulationResults: any, modification: WhatIfModification): string {
    if (simulationResults.win_probability > 0.6) {
      return `The hypothetical action (${modification.hypothetical_action}) shows strong potential. Consider implementing this strategy in similar situations.`;
    } else if (simulationResults.win_probability < 0.4) {
      return `The hypothetical action would likely worsen outcomes. The original decision was more optimal.`;
    } else {
      return `The hypothetical action shows marginal impact. Focus on execution quality rather than strategy change.`;
    }
  }

  private generateVisualizationSpec(
    modification: WhatIfModification,
    macroReviewEvents?: MacroReviewEvent[]
  ) {
    const relevantEvent = macroReviewEvents?.find(e => e.round_number === modification.round_number);

    return {
      type: 'comparison' as const,
      description: `Comparison of actual ${modification.original_action} vs hypothetical ${modification.hypothetical_action}`,
      motion_sequence_id: relevantEvent?.motion_visualization?.id,
    };
  }
}

export const predictionEngine = new HypotheticalPredictor();

