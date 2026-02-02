// Prediction Agent - Main orchestrator for hypothetical outcome predictions
// Coordinates multiple analysis methods and generates strategic insights

import type {
  WhatIfModification,
  WhatIfPrediction,
  RoundData,
  MatchMetadata,
  MacroReviewEvent,
} from '@/types/backend';
import type { GridDataPacket } from '@/types/grid';
import { predictionEngine } from './predictionEngine';
import { valorantRetakeAnalyzer, type RetakeAnalysis } from './valorant/retakeAnalyzer';
import { predictionValidator } from './predictionValidator';

export interface ParsedQuery {
  round_number: number;
  scenario: string;
  change_type: WhatIfModification['change_type'];
  original_action: string;
  hypothetical_action: string;
  game: 'valorant' | 'league_of_legends' | 'cs2';
  intent: 'retake' | 'save' | 'execute' | 'objective' | 'economic' | 'general';
}

export interface PredictionResult {
  query: string;
  parsed_query: ParsedQuery;
  actual_scenario: {
    success_probability: number;
    outcome: string;
    key_factors: string[];
  };
  hypothetical_scenario: {
    success_probability: number;
    outcome: string;
    key_factors: string[];
  };
  strategic_recommendation: string;
  confidence_score: number;
  supporting_data: Record<string, unknown>;
  visualization_prompt?: string;
  specialized_analysis?: RetakeAnalysis;
}

/**
 * Main Prediction Agent
 * Orchestrates analysis using multiple methods and specialized analyzers
 */
export class PredictionAgent {
  /**
   * Main entry point: Process a natural language "what if" query
   */
  async analyzeWhatIf(
    matchId: string,
    query: string,
    rounds: RoundData[],
    matchData: MatchMetadata,
    gridPackets?: GridDataPacket[],
    macroReviewEvents?: MacroReviewEvent[]
  ): Promise<PredictionResult> {
    // Step 1: Parse natural language query
    const parsedQuery = this.parseNaturalLanguage(query, rounds, matchData);

    // Step 2: Retrieve the actual game state at that moment
    const actualState = this.getGameState(rounds, parsedQuery.round_number, matchData);

    // Step 3: Analyze the actual outcome
    const actualOutcome = await this.analyzeActualOutcome(
      rounds,
      parsedQuery.round_number,
      matchData
    );

    // Step 4: Check if specialized analyzer should be used
    let specializedAnalysis: RetakeAnalysis | undefined;
    if (parsedQuery.intent === 'retake' && matchData.game === 'valorant') {
      const roundData = rounds.find(r => r.round_number === parsedQuery.round_number);
      if (roundData) {
        specializedAnalysis = await valorantRetakeAnalyzer.analyzeRetakeDecision(
          matchId,
          parsedQuery.round_number,
          roundData,
          matchData,
          gridPackets
        );
      }
    }

    // Step 5: Model the hypothetical scenario
    const hypotheticalModification: WhatIfModification = {
      round_number: parsedQuery.round_number,
      change_type: parsedQuery.change_type,
      original_action: parsedQuery.original_action,
      hypothetical_action: parsedQuery.hypothetical_action,
      context: { query, parsed_intent: parsedQuery.intent },
    };

    // Step 6: Calculate success probability using multiple methods
    const hypotheticalProbability = await this.calculateSuccessProbability(
      actualState,
      hypotheticalModification,
      rounds,
      matchData,
      specializedAnalysis
    );

    // Step 7: Generate comparative insights
    const insights = this.generateStrategicInsights(
      actualOutcome,
      hypotheticalProbability,
      parsedQuery,
      specializedAnalysis
    );

    // Step 8: Validate prediction
    const validated = await predictionValidator.validatePrediction(
      matchId,
      {
        actual: actualOutcome,
        hypothetical: hypotheticalProbability,
        recommendation: insights.recommendation,
      }
    );

    return {
      query,
      parsed_query: parsedQuery,
      actual_scenario: {
        success_probability: actualOutcome.success_probability,
        outcome: actualOutcome.outcome,
        key_factors: actualOutcome.key_factors,
      },
      hypothetical_scenario: {
        success_probability: hypotheticalProbability.success_probability,
        outcome: hypotheticalProbability.outcome,
        key_factors: hypotheticalProbability.key_factors,
      },
      strategic_recommendation: insights.recommendation,
      confidence_score: validated.confidence,
      supporting_data: {
        ...insights.data_points,
        validation: validated.validations,
      },
      visualization_prompt: this.generateVisualizationPrompt(
        actualState,
        hypotheticalModification,
        specializedAnalysis
      ),
      specialized_analysis: specializedAnalysis,
    };
  }

  /**
   * Parse natural language query to extract intent and parameters
   */
  private parseNaturalLanguage(
    query: string,
    rounds: RoundData[],
    matchData: MatchMetadata
  ): ParsedQuery {
    const lowerQuery = query.toLowerCase();

    // Extract round number
    let roundNumber = 0;
    const roundMatch = query.match(/round\s+(\d+)/i);
    if (roundMatch) {
      roundNumber = parseInt(roundMatch[1], 10);
    } else {
      // Default to last round if not specified
      roundNumber = rounds.length > 0 ? rounds[rounds.length - 1].round_number : 1;
    }

    // Detect game type
    const game: ParsedQuery['game'] = matchData.game === 'valorant' ? 'valorant' :
      matchData.game === 'cs2' ? 'cs2' : 'league_of_legends';

    // Detect intent
    let intent: ParsedQuery['intent'] = 'general';
    let changeType: WhatIfModification['change_type'] = 'economic_decision';
    let originalAction = 'unknown';
    let hypotheticalAction = 'unknown';
    let scenario = 'general';

    // Retake scenarios
    if (lowerQuery.includes('retake') || lowerQuery.includes('retaking')) {
      intent = 'retake';
      changeType = 'strategy_change';
      originalAction = 'attempt retake';
      hypotheticalAction = 'save';
      scenario = 'retake vs save';
    }
    // Save scenarios
    else if (lowerQuery.includes('save') || lowerQuery.includes('saving')) {
      intent = 'save';
      changeType = 'economic_decision';
      if (lowerQuery.includes('instead') || lowerQuery.includes('better')) {
        originalAction = 'force buy';
        hypotheticalAction = 'save';
      } else {
        originalAction = 'save';
        hypotheticalAction = 'force buy';
      }
      scenario = 'save vs force buy';
    }
    // Execute scenarios
    else if (lowerQuery.includes('execute') || lowerQuery.includes('execution')) {
      intent = 'execute';
      changeType = 'strategy_change';
      originalAction = 'original execute';
      hypotheticalAction = 'alternative execute';
      scenario = 'execute strategy';
    }
    // Economic decisions
    else if (
      lowerQuery.includes('economy') ||
      lowerQuery.includes('buy') ||
      lowerQuery.includes('force')
    ) {
      intent = 'economic';
      changeType = 'economic_decision';
      if (lowerQuery.includes('save')) {
        originalAction = 'force buy';
        hypotheticalAction = 'save';
      } else {
        originalAction = 'save';
        hypotheticalAction = 'force buy';
      }
      scenario = 'economic decision';
    }
    // Objective scenarios (League of Legends)
    else if (
      lowerQuery.includes('drake') ||
      lowerQuery.includes('baron') ||
      lowerQuery.includes('objective') ||
      lowerQuery.includes('contest')
    ) {
      intent = 'objective';
      changeType = 'strategy_change';
      originalAction = 'contest objective';
      hypotheticalAction = 'concede objective';
      scenario = 'objective contest';
    }

    return {
      round_number: roundNumber,
      scenario,
      change_type: changeType,
      original_action: originalAction,
      hypothetical_action: hypotheticalAction,
      game,
      intent,
    };
  }

  /**
   * Get game state at a specific round
   */
  private getGameState(
    rounds: RoundData[],
    roundNumber: number,
    matchData: MatchMetadata
  ): {
    round_number: number;
    score: [number, number];
    team_economy: number;
    opponent_economy: number;
    round_type: RoundData['round_type'];
  } {
    const round = rounds.find(r => r.round_number === roundNumber);
    if (!round) {
      return {
        round_number: roundNumber,
        score: [0, 0],
        team_economy: 0,
        opponent_economy: 0,
        round_type: 'full',
      };
    }

    // Calculate score up to this round
    let teamAScore = 0;
    let teamBScore = 0;
    for (let i = 0; i < roundNumber; i++) {
      const r = rounds[i];
      if (r) {
        if (r.winning_team_id === matchData.team_a_id) {
          teamAScore++;
        } else if (r.winning_team_id === matchData.team_b_id) {
          teamBScore++;
        }
      }
    }

    return {
      round_number: roundNumber,
      score: [teamAScore, teamBScore],
      team_economy: round.team_a_start_money,
      opponent_economy: round.team_b_start_money,
      round_type: round.round_type,
    };
  }

  /**
   * Analyze the actual outcome
   */
  private async analyzeActualOutcome(
    rounds: RoundData[],
    roundNumber: number,
    matchData: MatchMetadata
  ): Promise<{
    success_probability: number;
    outcome: string;
    key_factors: string[];
  }> {
    const round = rounds.find(r => r.round_number === roundNumber);
    if (!round) {
      return {
        success_probability: 0.5,
        outcome: 'Unknown',
        key_factors: [],
      };
    }

    const won = round.winning_team_id === matchData.team_a_id;
    const actualScore = this.calculateScore(rounds, roundNumber, matchData);

    return {
      success_probability: won ? 1.0 : 0.0,
      outcome: won ? 'Win' : 'Loss',
      key_factors: [
        `Score at round ${roundNumber}: ${actualScore[0]}-${actualScore[1]}`,
        `Round type: ${round.round_type}`,
        `Economy: ${round.team_a_start_money} vs ${round.team_b_start_money}`,
      ],
    };
  }

  /**
   * Calculate success probability using multiple methods
   */
  private async calculateSuccessProbability(
    gameState: ReturnType<typeof this.getGameState>,
    modification: WhatIfModification,
    rounds: RoundData[],
    matchData: MatchMetadata,
    specializedAnalysis?: RetakeAnalysis
  ): Promise<{
    success_probability: number;
    outcome: string;
    key_factors: string[];
  }> {
    // If we have specialized analysis (e.g., retake), use it
    if (specializedAnalysis) {
      return {
        success_probability: specializedAnalysis.retake_success_probability,
        outcome: specializedAnalysis.retake_success_probability > 0.5 ? 'Win' : 'Loss',
        key_factors: specializedAnalysis.key_factors.map(f => f.explanation),
      };
    }

    // Otherwise, use the general prediction engine
    const prediction = await predictionEngine.predictScenario(
      matchData.id,
      modification,
      rounds,
      matchData
    );

    return {
      success_probability: prediction.predicted_outcome.win_probability,
      outcome: prediction.predicted_outcome.most_likely_score,
      key_factors: prediction.key_findings,
    };
  }

  /**
   * Generate strategic insights comparing actual vs hypothetical
   */
  private generateStrategicInsights(
    actual: { success_probability: number; outcome: string },
    hypothetical: { success_probability: number; outcome: string },
    parsedQuery: ParsedQuery,
    specializedAnalysis?: RetakeAnalysis
  ): {
    recommendation: string;
    data_points: Record<string, unknown>;
  } {
    const successDiff = hypothetical.success_probability - actual.success_probability;

    let recommendation = '';
    if (specializedAnalysis) {
      recommendation = specializedAnalysis.recommendation;
    } else if (successDiff > 0.2) {
      recommendation = `The ${parsedQuery.hypothetical_action} had a ${Math.round(hypothetical.success_probability * 100)}% probability of success, significantly higher than the actual decision (${Math.round(actual.success_probability * 100)}%). ${parsedQuery.hypothetical_action} was the superior strategic choice.`;
    } else if (successDiff < -0.2) {
      recommendation = `The actual decision (${Math.round(actual.success_probability * 100)}% success) was better than the hypothetical alternative (${Math.round(hypothetical.success_probability * 100)}%). The original decision was optimal.`;
    } else {
      recommendation = `Both decisions had similar success probabilities (${Math.round(hypothetical.success_probability * 100)}% vs ${Math.round(actual.success_probability * 100)}%). The actual decision was reasonable given the game state.`;
    }

    return {
      recommendation,
      data_points: {
        success_probability_difference: successDiff,
        actual_success: actual.success_probability,
        hypothetical_success: hypothetical.success_probability,
        scenario: parsedQuery.scenario,
      },
    };
  }

  /**
   * Generate visualization prompt for HY-Motion
   */
  private generateVisualizationPrompt(
    gameState: ReturnType<typeof this.getGameState>,
    modification: WhatIfModification,
    specializedAnalysis?: RetakeAnalysis
  ): string {
    if (specializedAnalysis) {
      return `Visualize a ${specializedAnalysis.scenario} on ${gameState.round_type} round. Show the retake attempt with ${specializedAnalysis.retake_success_probability * 100}% success probability, then compare to the save alternative showing ${specializedAnalysis.save_impact.next_round_win_probability * 100}% next round win probability.`;
    }

    return `Visualize round ${gameState.round_number} (score ${gameState.score[0]}-${gameState.score[1]}) showing the actual ${modification.original_action} versus the hypothetical ${modification.hypothetical_action}.`;
  }

  /**
   * Helper: Calculate score at a specific round
   */
  private calculateScore(
    rounds: RoundData[],
    roundNumber: number,
    matchData: MatchMetadata
  ): [number, number] {
    let teamAScore = 0;
    let teamBScore = 0;

    for (let i = 0; i < roundNumber; i++) {
      const round = rounds[i];
      if (round) {
        if (round.winning_team_id === matchData.team_a_id) {
          teamAScore++;
        } else if (round.winning_team_id === matchData.team_b_id) {
          teamBScore++;
        }
      }
    }

    return [teamAScore, teamBScore];
  }
}

export const predictionAgent = new PredictionAgent();


