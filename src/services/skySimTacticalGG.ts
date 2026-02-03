// SkySim Tactical GG Orchestration Service
// Main service that coordinates all analysis layers and generates comprehensive insights

import type { GridDataPacket } from '@/types/grid';
import { gridIngestion, type GridIngestionResult } from './gridIngestion';
import { heuristicEngine, type MicroAnalysisResult } from './heuristicEngine';
import { patternRecognition, type PatternAnalysisResult } from './patternRecognition';
import { predictiveAnalytics, type PredictiveAnalysisResult } from './predictiveAnalytics';
import { insightEngine, type InsightGenerationResult } from './insightEngine';
import type { Insight } from '@/types';
import { TacticalUtilityEngine } from './TacticalUtilityEngine';
import type { UtilityDecision, TacticalUtilityState } from '@/types/utility';

export interface SkySimTacticalGGAnalysis {
  ingestion_result: GridIngestionResult;
  micro_analysis: MicroAnalysisResult;
  pattern_analysis: PatternAnalysisResult;
  predictive_analysis: PredictiveAnalysisResult;
  insights: InsightGenerationResult;
  summary: AnalysisSummary;
  utility_recommendations?: UtilityDecision;
}

export interface AnalysisSummary {
  key_findings: string[];
  top_priorities: string[];
  overall_team_health: number;
  improvement_areas: string[];
  strengths: string[];
}

class SkySimTacticalGGService {
  private utilityEngine = new TacticalUtilityEngine();

  async analyzeMatch(gridPackets: GridDataPacket[]): Promise<SkySimTacticalGGAnalysis> {
    const ingestionResult = gridIngestion.processGridData(gridPackets);

    const microAnalysis = heuristicEngine.analyzeMicro(
      ingestionResult.enriched,
      gridPackets
    );

    const patternAnalysis = patternRecognition.analyzePatterns(
      ingestionResult.enriched,
      ingestionResult.team_sync_events,
      this.groupPacketsByRound(gridPackets)
    );

    const predictiveAnalysis = predictiveAnalytics.analyzeMicroMacroCorrelation(
      microAnalysis.mistakes,
      [ingestionResult.round_summary],
      ingestionResult.enriched
    );

    const insights = insightEngine.generateInsights(
      microAnalysis,
      patternAnalysis,
      predictiveAnalysis
    );

    const summary = this.generateSummary(
      microAnalysis,
      patternAnalysis,
      predictiveAnalysis,
      insights
    );

    return {
      ingestion_result: ingestionResult,
      micro_analysis: microAnalysis,
      pattern_analysis: patternAnalysis,
      predictive_analysis: predictiveAnalysis,
      insights,
      summary,
      utility_recommendations: gridPackets.length > 0 ? this.getUtilityRecommendationsFromPackets(gridPackets) : undefined,
    };
  }

  async getLiveInsights(
    recentPackets: GridDataPacket[],
    _previousAnalysis?: SkySimTacticalGGAnalysis
  ): Promise<{
    alerts: Insight[];
    recommendations: string[];
    utility_recommendations?: UtilityDecision;
    tactical_overlay: TacticalOverlay;
  }> {
    const ingestionResult = gridIngestion.processGridData(recentPackets);
    const microAnalysis = heuristicEngine.analyzeMicro(
      ingestionResult.enriched,
      recentPackets
    );

    const alerts: Insight[] = [];
    for (const mistake of microAnalysis.mistakes) {
      if (mistake.severity > 0.7) {
        alerts.push({
          id: `alert-${Date.now()}-${mistake.id}`,
          type: 'warning',
          title: mistake.type,
          description: mistake.description,
          priority: 'high',
          player_id: mistake.player_id,
          created_at: new Date().toISOString(),
          actionable: true,
        });
      }
    }

    const recommendations: string[] = [];
    if (microAnalysis.technical_issues.length > 0) {
      recommendations.push('Review utility timing and coordination');
    }
    if (microAnalysis.mistakes.filter((m) => m.type === 'trading').length > 0) {
      recommendations.push('Focus on trade kills in next round');
    }

    const utilityRecommendations = recentPackets.length > 0 
      ? this.getUtilityRecommendationsFromPackets(recentPackets)
      : undefined;

    const tacticalOverlay: TacticalOverlay = {
      current_phase: ingestionResult.round_summary.economy_state,
      team_coordination: 0.65,
      key_events: ingestionResult.round_summary.key_events.slice(-3),
      predicted_actions: microAnalysis.predicted_actions.slice(-5),
    };

    return {
      alerts,
      recommendations,
      utility_recommendations: utilityRecommendations,
      tactical_overlay: tacticalOverlay,
    };
  }

  private getUtilityRecommendationsFromPackets(packets: GridDataPacket[]): UtilityDecision {
    const latest = packets[packets.length - 1];
    const isValorant = latest.game === 'VALORANT';
    
    let matchTime = 0;
    let role = 'Unknown';
    let economy = 0;

    if (isValorant) {
      const context = latest.match_context as any;
      const player = latest.player as any;
      const inv = latest.inventory as any;
      matchTime = 100 - (context.round_time_remaining || 0); // Approx
      role = player.role || 'Duelist'; // Default if not found
      economy = inv?.credits || 0;
    } else {
      const context = latest.match_context as any;
      const player = latest.player as any;
      const inv = latest.inventory as any;
      matchTime = (context.game_time || 0) / 60; // in minutes
      role = player.role || 'Mid'; // Default
      economy = inv?.gold || 0;
    }

    const state: TacticalUtilityState = {
      game: isValorant ? 'VALORANT' : 'LOL',
      matchTime,
      phase: isValorant ? (latest.match_context as any).round_phase : 'mid-game',
      role,
      economy,
      agent: isValorant ? (latest.player as any).agent : (latest.player as any).champion
    };

    return this.utilityEngine.getRecommendations(state);
  }

  private generateSummary(
    microAnalysis: MicroAnalysisResult,
    patternAnalysis: PatternAnalysisResult,
    predictiveAnalysis: PredictiveAnalysisResult,
    insights: InsightGenerationResult
  ): AnalysisSummary {
    const keyFindings: string[] = [];
    const topPriorities: string[] = [];
    const improvementAreas: string[] = [];
    const strengths: string[] = [];

    if (predictiveAnalysis.micro_macro_correlations.length > 0) {
      const topCorrelation = predictiveAnalysis.micro_macro_correlations[0];
      if (topCorrelation) {
        keyFindings.push(
          `${topCorrelation.micro_action} has ${Math.round(topCorrelation.correlation_strength * 100)}% correlation with round losses`
        );
      }
    }

    if (patternAnalysis.team_coordination.overall_score < 0.6) {
      keyFindings.push(
        `Team coordination score: ${Math.round(patternAnalysis.team_coordination.overall_score * 100)}%`
      );
    }

    for (const insight of insights.prioritized_insights.slice(0, 3)) {
      topPriorities.push(insight.title);
    }

    if (patternAnalysis.team_coordination.utility_timing < 0.6) {
      improvementAreas.push('Utility timing');
    }
    if (patternAnalysis.team_coordination.trade_efficiency < 0.6) {
      improvementAreas.push('Trade efficiency');
    }

    for (const execute of patternAnalysis.execute_patterns) {
      if (execute.success_rate > 0.7) {
        strengths.push(`${execute.site} executes (${Math.round(execute.success_rate * 100)}% success)`);
      }
    }

    const teamHealth = (
      patternAnalysis.team_coordination.overall_score * 0.4 +
      (patternAnalysis.execute_patterns.reduce((sum, e) => sum + e.success_rate, 0) / 
       Math.max(patternAnalysis.execute_patterns.length, 1)) * 0.3 +
      (1 - microAnalysis.mistakes.length / 100) * 0.3
    );

    return {
      key_findings: keyFindings,
      top_priorities: topPriorities,
      overall_team_health: Math.max(0, Math.min(1, teamHealth)),
      improvement_areas: improvementAreas,
      strengths: strengths,
    };
  }

  private groupPacketsByRound(packets: GridDataPacket[]): GridDataPacket[][] {
    const rounds: GridDataPacket[][] = [];
    let currentRound: GridDataPacket[] = [];

    for (const packet of packets) {
      if (packet.match_context.round_phase === 'pre_round' && currentRound.length > 0) {
        rounds.push(currentRound);
        currentRound = [packet];
      } else {
        currentRound.push(packet);
      }
    }

    if (currentRound.length > 0) {
      rounds.push(currentRound);
    }

    return rounds;
  }
}

export interface TacticalOverlay {
  current_phase: string;
  team_coordination: number;
  key_events: unknown[];
  predicted_actions: unknown[];
}

export const skySimTacticalGG = new SkySimTacticalGGService();
