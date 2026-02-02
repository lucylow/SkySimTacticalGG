// Assistant Coach Orchestration Service
// Main service that coordinates all analysis layers and generates comprehensive insights

import type { GridDataPacket } from '@/types/grid';
import { gridIngestion, type GridIngestionResult } from './gridIngestion';
import { heuristicEngine, type MicroAnalysisResult } from './heuristicEngine';
import { patternRecognition, type PatternAnalysisResult } from './patternRecognition';
import { predictiveAnalytics, type PredictiveAnalysisResult } from './predictiveAnalytics';
import { insightEngine, type InsightGenerationResult } from './insightEngine';
import type { Insight } from '@/types';

export interface AssistantCoachAnalysis {
  ingestion_result: GridIngestionResult;
  micro_analysis: MicroAnalysisResult;
  pattern_analysis: PatternAnalysisResult;
  predictive_analysis: PredictiveAnalysisResult;
  insights: InsightGenerationResult;
  summary: AnalysisSummary;
}

export interface AnalysisSummary {
  key_findings: string[];
  top_priorities: string[];
  overall_team_health: number; // 0-1
  improvement_areas: string[];
  strengths: string[];
}

class AssistantCoachService {
  /**
   * Perform comprehensive analysis from GRID data to actionable insights
   */
  async analyzeMatch(gridPackets: GridDataPacket[]): Promise<AssistantCoachAnalysis> {
    // Step 1: Ingest and enrich GRID data
    const ingestionResult = gridIngestion.processGridData(gridPackets);

    // Step 2: Micro-analysis (individual player mistakes, predictions)
    const microAnalysis = heuristicEngine.analyzeMicro(
      ingestionResult.enriched,
      gridPackets
    );

    // Step 3: Pattern recognition (team coordination, executes, retakes)
    const patternAnalysis = patternRecognition.analyzePatterns(
      ingestionResult.enriched,
      ingestionResult.team_sync_events,
      this.groupPacketsByRound(gridPackets)
    );

    // Step 4: Predictive analytics (micro-macro correlation, economy, fatigue)
    const predictiveAnalysis = predictiveAnalytics.analyzeMicroMacroCorrelation(
      microAnalysis.mistakes,
      [ingestionResult.round_summary],
      ingestionResult.enriched
    );

    // Step 5: Generate insights
    const insights = insightEngine.generateInsights(
      microAnalysis,
      patternAnalysis,
      predictiveAnalysis
    );

    // Step 6: Generate summary
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
    };
  }

  /**
   * Get real-time insights for live coaching
   */
  async getLiveInsights(
    recentPackets: GridDataPacket[],
    previousAnalysis?: AssistantCoachAnalysis
  ): Promise<{
    alerts: Insight[];
    recommendations: string[];
    tactical_overlay: TacticalOverlay;
  }> {
    // Quick analysis of recent packets
    const ingestionResult = gridIngestion.processGridData(recentPackets);
    const microAnalysis = heuristicEngine.analyzeMicro(
      ingestionResult.enriched,
      recentPackets
    );

    // Extract high-priority alerts
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

    // Generate quick recommendations
    const recommendations: string[] = [];
    if (microAnalysis.technical_issues.length > 0) {
      recommendations.push('Review utility timing and coordination');
    }
    if (microAnalysis.mistakes.filter((m) => m.type === 'trading').length > 0) {
      recommendations.push('Focus on trade kills in next round');
    }

    // Generate tactical overlay data
    const tacticalOverlay: TacticalOverlay = {
      current_phase: ingestionResult.round_summary.economy_state,
      team_coordination: 0.65, // Would calculate from recent data
      key_events: ingestionResult.round_summary.key_events.slice(-3),
      predicted_actions: microAnalysis.predicted_actions.slice(-5),
    };

    return {
      alerts,
      recommendations,
      tactical_overlay: tacticalOverlay,
    };
  }

  /**
   * Generate analysis summary
   */
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

    // Extract key findings
    if (predictiveAnalysis.micro_macro_correlations.length > 0) {
      const topCorrelation = predictiveAnalysis.micro_macro_correlations[0];
      keyFindings.push(
        `${topCorrelation.micro_action} has ${Math.round(topCorrelation.correlation_strength * 100)}% correlation with round losses`
      );
    }

    if (patternAnalysis.team_coordination.overall_score < 0.6) {
      keyFindings.push(
        `Team coordination score: ${Math.round(patternAnalysis.team_coordination.overall_score * 100)}%`
      );
    }

    // Extract priorities
    for (const insight of insights.prioritized_insights.slice(0, 3)) {
      topPriorities.push(insight.title);
    }

    // Extract improvement areas
    if (patternAnalysis.team_coordination.utility_timing < 0.6) {
      improvementAreas.push('Utility timing');
    }
    if (patternAnalysis.team_coordination.trade_efficiency < 0.6) {
      improvementAreas.push('Trade efficiency');
    }

    // Extract strengths
    for (const execute of patternAnalysis.execute_patterns) {
      if (execute.success_rate > 0.7) {
        strengths.push(`${execute.site} executes (${Math.round(execute.success_rate * 100)}% success)`);
      }
    }

    // Calculate overall team health
    const teamHealth = (
      patternAnalysis.team_coordination.overall_score * 0.4 +
      (patternAnalysis.execute_patterns.reduce((sum, e) => sum + e.success_rate, 0) / 
       Math.max(patternAnalysis.execute_patterns.length, 1)) * 0.3 +
      (1 - microAnalysis.mistakes.length / 100) * 0.3 // Inverse of mistake frequency
    );

    return {
      key_findings: keyFindings,
      top_priorities: topPriorities,
      overall_team_health: Math.max(0, Math.min(1, teamHealth)),
      improvement_areas: improvementAreas,
      strengths: strengths,
    };
  }

  /**
   * Group packets by round (simplified)
   */
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
  key_events: any[];
  predicted_actions: any[];
}

export const assistantCoach = new AssistantCoachService();


