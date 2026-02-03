// Micro-Pattern Detector Agent - Detects recurring player patterns and mistakes
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';
import type { FetchedData } from './DataFetcherAgent';

export interface Pattern {
  type: string;
  pattern: PatternData;
  impact_score: number;
}

export interface PatternData {
  significance: number;
  win_rate?: number;
  kast_rate?: number;
  predictable?: boolean;
  sample_size?: number;
  data?: unknown[];
  efficiency?: number;
}

export interface PatternAnalysisResult {
  player_id: string;
  patterns_found: number;
  critical_patterns: Pattern[];
  all_patterns: Pattern[];
  confidence: number;
}

class MicroPatternDetectorAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'MicroPatternDetector',
      AgentRole.MICRO_ANALYZER,
      {
        pattern_recognition: true,
        statistical_analysis: true,
        anomaly_detection: true,
      },
      {
        enabled: true,
        pattern_threshold: 0.7,
        sample_size_minimum: 10,
        ...config,
      }
    );
  }

  processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: PatternAnalysisResult;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { player_data, match_data } = task.input_data as {
        player_data?: { id: string };
        match_data?: FetchedData;
      };

      if (!player_data || !match_data) {
        throw new Error('Missing required input data: player_data and match_data');
      }

      const patterns: Pattern[] = [];

      // Pattern 1: Opening duel analysis
      const openingPattern = this.analyzeOpeningDuels(player_data, match_data);
      if (openingPattern.significance > (this.config.pattern_threshold || 0.7)) {
        patterns.push({
          type: 'OPENING_DUEL_PATTERN',
          pattern: openingPattern,
          impact_score: this.calculateImpact(openingPattern, match_data),
        });
      }

      // Pattern 2: Utility usage patterns
      const utilityPattern = this.analyzeUtilityUsage(player_data, match_data);
      if (utilityPattern.efficiency !== undefined && utilityPattern.efficiency < 0.4) {
        patterns.push({
          type: 'UTILITY_INEFFICIENCY',
          pattern: utilityPattern,
          impact_score: this.calculateEconomicImpact(utilityPattern, match_data),
        });
      }

      // Pattern 3: Positioning analysis
      const positioningPatterns = this.analyzePositioning(player_data, match_data);
      patterns.push(...positioningPatterns);

      // Rank patterns by impact
      const rankedPatterns = patterns.sort((a, b) => b.impact_score - a.impact_score);

      const criticalPatterns = rankedPatterns.filter(
        (p) => p.impact_score > (this.config.pattern_threshold || 0.7)
      );

      const processingTime = this.getProcessingTime();

      return Promise.resolve({
        success: true,
        result: {
          player_id: player_data.id,
          patterns_found: rankedPatterns.length,
          critical_patterns: criticalPatterns,
          all_patterns: rankedPatterns,
          confidence: this.calculateConfidence(rankedPatterns),
        },
        processing_time_ms: processingTime,
        task_type: 'pattern_detection',
        accuracy: this.calculateConfidence(rankedPatterns),
      });
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return Promise.resolve({
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'pattern_detection',
      });
    }
  }

  private analyzeOpeningDuels(playerData: { id: string }, matchData: FetchedData): PatternData {
    const openingDuels: Array<{
      round: number;
      won: boolean;
      time: number;
      position?: unknown;
      weapons?: unknown;
      resulting_kast: boolean;
    }> = [];

    // Analyze rounds for opening duels
    for (const match of matchData.matches || []) {
      for (const round of match.rounds || []) {
        const roundData = round as {
          round_number?: number;
          events?: Array<{
            type?: string;
            timestamp?: number;
            attacker?: string;
            defender?: string;
            winner?: string;
            position?: unknown;
            weapons?: unknown;
          }>;
        };

        if (!roundData.events) continue;

        // Find opening duels (within first 30 seconds of round)
        const duelEvents = roundData.events.filter(
          (event) =>
            event.type === 'kill' &&
            (event.timestamp || 0) < 30 &&
            (event.attacker === playerData.id || event.defender === playerData.id)
        );

        for (const duel of duelEvents) {
          const won = duel.winner === playerData.id;
          openingDuels.push({
            round: roundData.round_number || 0,
            won,
            time: duel.timestamp || 0,
            position: duel.position,
            weapons: duel.weapons,
            resulting_kast: this.calculateKastImpact(duel, roundData),
          });
        }
      }
    }

    if (openingDuels.length === 0) {
      return { significance: 0, data: [] };
    }

    const totalDuels = openingDuels.length;
    const winRate = openingDuels.filter((d) => d.won).length / totalDuels;
    const kastRate = openingDuels.filter((d) => d.resulting_kast).length / totalDuels;
    const predictable = this.checkPredictability(openingDuels);

    return {
      significance: this.calculateSignificance(totalDuels, winRate, predictable),
      win_rate: winRate,
      kast_rate: kastRate,
      predictable,
      sample_size: totalDuels,
      data: openingDuels.slice(0, 10),
    };
  }

  private analyzeUtilityUsage(playerData: { id: string }, matchData: FetchedData): PatternData {
    // Simplified utility analysis
    // In a real implementation, this would analyze ability usage efficiency
    const utilityEvents =
      matchData.events?.filter((e: unknown) => {
        const event = e as { type?: string; player_id?: string };
        return event.type === 'ability' && event.player_id === playerData.id;
      }) || [];

    // Calculate efficiency (simplified)
    const totalUtility = utilityEvents.length;
    const effectiveUtility = utilityEvents.filter(() => Math.random() > 0.6).length; // Sample calculation

    const efficiency = totalUtility > 0 ? effectiveUtility / totalUtility : 0;

    return {
      significance: totalUtility > 10 ? 0.8 : 0.3,
      efficiency,
      sample_size: totalUtility,
      data: utilityEvents.slice(0, 5),
    };
  }

  private analyzePositioning(_playerData: { id: string }, _matchData: FetchedData): Pattern[] {
    // Simplified positioning analysis
    // In a real implementation, this would analyze heatmaps and common positions
    return [
      {
        type: 'POSITIONING_PATTERN',
        pattern: {
          significance: 0.6,
          sample_size: 100,
        },
        impact_score: 0.5,
      },
    ];
  }

  private calculateImpact(pattern: PatternData, _matchData: FetchedData): number {
    // Calculate impact score based on pattern significance and sample size
    const baseScore = pattern.significance || 0;
    const sampleWeight = Math.min((pattern.sample_size || 0) / 50, 1);
    return baseScore * 0.7 + sampleWeight * 0.3;
  }

  private calculateEconomicImpact(pattern: PatternData, _matchData: FetchedData): number {
    // Economic impact calculation
    const efficiency = pattern.efficiency || 0;
    return 1 - efficiency; // Lower efficiency = higher impact
  }

  private calculateKastImpact(_duel: unknown, _roundData: unknown): boolean {
    // Simplified KAST calculation
    // In real implementation, would check if player got kill, assist, survived, or was traded
    return Math.random() > 0.3; // Sample
  }

  private checkPredictability(duels: Array<{ won: boolean }>): boolean {
    // Check if pattern is predictable (e.g., always loses opening duels)
    if (duels.length < 5) return false;

    const winRate = duels.filter((d) => d.won).length / duels.length;
    // Predictable if win rate is very high or very low
    return winRate < 0.2 || winRate > 0.8;
  }

  private calculateSignificance(sampleSize: number, winRate: number, predictable: boolean): number {
    if (sampleSize < (this.config.sample_size_minimum || 10)) return 0;

    const sampleWeight = Math.min(sampleSize / 30, 1);
    const patternStrength = Math.abs(winRate - 0.5) * 2; // Distance from 50%
    const predictabilityBonus = predictable ? 0.2 : 0;

    return Math.min(sampleWeight * 0.4 + patternStrength * 0.4 + predictabilityBonus, 1);
  }

  private calculateConfidence(patterns: Pattern[]): number {
    if (patterns.length === 0) return 0;

    const avgImpact = patterns.reduce((sum, p) => sum + p.impact_score, 0) / patterns.length;
    const sampleSize = patterns.reduce(
      (sum, p) => sum + ((p.pattern.sample_size || 0) > 10 ? 1 : 0),
      0
    );

    return Math.min(avgImpact * 0.7 + (sampleSize / patterns.length) * 0.3, 1);
  }
}

export const microPatternDetectorAgent = new MicroPatternDetectorAgent();

