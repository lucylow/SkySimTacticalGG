// Strategic Analyzer Agent - Connects micro patterns to macro outcomes
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';
import type { PatternAnalysisResult } from './MicroPatternDetectorAgent';
import type { FetchedData } from './DataFetcherAgent';

export interface Correlation {
  pattern_type: string;
  correlation: CorrelationData;
  affected_rounds: number;
  round_loss_rate: number;
  strategic_implication: string;
}

export interface CorrelationData {
  strength: number;
  direction: 'positive' | 'negative';
  confidence: number;
}

export interface StrategicAnalysisResult {
  total_correlations: number;
  critical_insights: CriticalInsight[];
  all_correlations: Correlation[];
  confidence: number;
}

export interface CriticalInsight {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  statement: string;
  recommendation: string;
  data_points: unknown[];
}

class StrategicAnalyzerAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'StrategicAnalyzer',
      AgentRole.STRATEGIC_ANALYZER,
      {
        correlation_analysis: true,
        impact_calculation: true,
        strategy_recommendation: true,
      },
      {
        enabled: true,
        correlation_threshold: 0.6,
        ...config,
      }
    );
  }

  async processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: StrategicAnalysisResult;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { micro_patterns, match_data } = task.input_data as {
        micro_patterns?: PatternAnalysisResult;
        match_data?: FetchedData;
      };

      if (!micro_patterns || !match_data) {
        throw new Error('Missing required input data: micro_patterns and match_data');
      }

      const correlations: Correlation[] = [];

      // Analyze each critical pattern
      for (const pattern of micro_patterns.critical_patterns || []) {
        const affectedRounds = this.findAffectedRounds(pattern, match_data);

        if (affectedRounds.length > 0) {
          const correlation = this.calculateCorrelation(pattern, affectedRounds, match_data);

          if (Math.abs(correlation.strength) > (this.config.correlation_threshold || 0.6)) {
            correlations.push({
              pattern_type: pattern.type,
              correlation,
              affected_rounds: affectedRounds.length,
              round_loss_rate: correlation.round_loss_rate,
              strategic_implication: this.generateStrategicImplication(pattern, correlation),
            });
          }
        }
      }

      // Generate insights
      const insights: CriticalInsight[] = [];
      for (const corr of correlations) {
        if (corr.round_loss_rate > 0.7) {
          insights.push({
            severity: 'CRITICAL',
            statement: this.formatCriticalInsight(corr),
            recommendation: this.generateRecommendation(corr),
            data_points: this.extractDataPoints(corr, match_data),
          });
        } else if (corr.round_loss_rate > 0.5) {
          insights.push({
            severity: 'HIGH',
            statement: this.formatCriticalInsight(corr),
            recommendation: this.generateRecommendation(corr),
            data_points: this.extractDataPoints(corr, match_data),
          });
        }
      }

      const processingTime = this.getProcessingTime();

      return {
        success: true,
        result: {
          total_correlations: correlations.length,
          critical_insights: insights,
          all_correlations: correlations,
          confidence: this.calculateConfidence(correlations),
        },
        processing_time_ms: processingTime,
        task_type: 'strategic_analysis',
        accuracy: this.calculateConfidence(correlations),
      };
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'strategic_analysis',
      };
    }
  }

  private findAffectedRounds(
    _pattern: { type: string; impact_score: number },
    matchData: FetchedData
  ): number[] {
    const affectedRounds: number[] = [];

    // Find rounds where this pattern occurred
    for (const match of matchData.matches || []) {
      for (const round of match.rounds || []) {
        const roundData = round as {
          round_number?: number;
        };

        // Simplified: include rounds for pattern analysis
        if (roundData.round_number !== undefined) {
          affectedRounds.push(roundData.round_number);
        }
      }
    }

    return affectedRounds;
  }

  private calculateCorrelation(
    _pattern: { type: string; impact_score: number },
    affectedRounds: number[],
    matchData: FetchedData
  ): CorrelationData & { round_loss_rate: number } {
    // Calculate correlation between pattern and round outcomes
    let roundsWithPattern = 0;
    let roundsLost = 0;

    for (const match of matchData.matches || []) {
      for (const round of match.rounds || []) {
        const roundData = round as {
          round_number?: number;
          winning_team_id?: string;
        };

        if (roundData.round_number && affectedRounds.includes(roundData.round_number)) {
          roundsWithPattern++;
          // Simplified: assume loss if no winning_team_id
          if (!roundData.winning_team_id) {
            roundsLost++;
          }
        }
      }
    }

    const roundLossRate = roundsWithPattern > 0 ? roundsLost / roundsWithPattern : 0;
    const strength = Math.abs(roundLossRate - 0.5) * 2; // Distance from 50%

    return {
      strength,
      direction: roundLossRate > 0.5 ? 'negative' : 'positive',
      confidence: Math.min(affectedRounds.length / 10, 1), // More rounds = higher confidence
      round_loss_rate: roundLossRate,
    };
  }

  private generateStrategicImplication(
    pattern: { type: string },
    correlation: CorrelationData
  ): string {
    if (pattern.type === 'OPENING_DUEL_PATTERN') {
      return correlation.direction === 'negative'
        ? 'Losing opening duels significantly impacts round outcomes'
        : 'Winning opening duels provides strategic advantage';
    }
    if (pattern.type === 'UTILITY_INEFFICIENCY') {
      return 'Inefficient utility usage correlates with round losses';
    }
    return 'Pattern has measurable impact on round outcomes';
  }

  private formatCriticalInsight(correlation: Correlation): string {
    const lossRate = correlation.round_loss_rate;
    const affectedRounds = correlation.affected_rounds;

    if (correlation.pattern_type === 'OPENING_DUEL_PATTERN') {
      return `Team loses ${Math.round(lossRate * 100)}% of rounds when player dies first without KAST. This occurred in ${affectedRounds} rounds analyzed.`;
    }

    if (correlation.pattern_type === 'UTILITY_INEFFICIENCY') {
      return `Utility waste correlates with ${Math.round(lossRate * 100)}% round loss rate. Review utility usage in key rounds.`;
    }

    return `Pattern detected with ${Math.round(lossRate * 100)}% impact on round outcomes.`;
  }

  private generateRecommendation(correlation: Correlation): string {
    if (correlation.pattern_type === 'OPENING_DUEL_PATTERN') {
      return 'Focus on improving opening duel win rate through positioning and crosshair placement practice.';
    }
    if (correlation.pattern_type === 'UTILITY_INEFFICIENCY') {
      return 'Review utility usage timing and coordination with team. Practice utility lineups and timing.';
    }
    return 'Address this pattern through targeted practice and strategic adjustments.';
  }

  private extractDataPoints(_correlation: Correlation, matchData: FetchedData): unknown[] {
    // Extract relevant data points for the insight
    const dataPoints: unknown[] = [];

    for (const match of matchData.matches || []) {
      for (const round of match.rounds || []) {
        const roundData = round as { round_number?: number };
        // Simplified extraction
        if (roundData.round_number) {
          dataPoints.push({
            round: roundData.round_number,
            match_id: match.id,
          });
        }
      }
    }

    return dataPoints.slice(0, 10); // Limit to 10 data points
  }

  private calculateConfidence(correlations: Correlation[]): number {
    if (correlations.length === 0) return 0;

    const avgCorrelationStrength =
      correlations.reduce((sum, c) => sum + Math.abs(c.correlation.strength), 0) /
      correlations.length;

    const avgSampleSize =
      correlations.reduce((sum, c) => sum + c.affected_rounds, 0) / correlations.length;

    const sampleWeight = Math.min(avgSampleSize / 20, 1);

    return Math.min(avgCorrelationStrength * 0.7 + sampleWeight * 0.3, 1);
  }
}

export const strategicAnalyzerAgent = new StrategicAnalyzerAgent();
