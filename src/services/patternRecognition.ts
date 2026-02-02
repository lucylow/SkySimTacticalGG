// Pattern Recognition Service for Meso-Level Analysis
// Analyzes team coordination, execute efficiency, and tactical patterns

import type { GridDataPacket } from '@/types/grid';
import type { TeamSyncEvent } from './gridIngestion';
import type { EnrichedGridData } from '@/types/tactical';

export interface PatternAnalysisResult {
  team_coordination: TeamCoordinationScore;
  execute_patterns: ExecutePattern[];
  default_patterns: DefaultPattern[];
  retake_patterns: RetakePattern[];
  recommendations: PatternRecommendation[];
}

export interface TeamCoordinationScore {
  overall_score: number; // 0-1
  utility_timing: number;
  trade_efficiency: number;
  positioning_sync: number;
  communication_quality: number; // Inferred from actions
  breakdowns: CoordinationBreakdown[];
}

export interface CoordinationBreakdown {
  timestamp: number;
  type: 'utility_miss' | 'trade_fail' | 'positioning_error' | 'timing_issue';
  players_involved: string[];
  description: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ExecutePattern {
  pattern_id: string;
  site: string;
  frequency: number;
  success_rate: number;
  avg_duration: number;
  utility_usage: UtilityUsage;
  player_roles: Record<string, string[]>; // role -> player_ids
  weaknesses: string[];
  strengths: string[];
}

export interface UtilityUsage {
  smokes: number;
  flashes: number;
  molotovs: number;
  recon: number;
  timing_score: number; // 0-1
}

export interface DefaultPattern {
  pattern_id: string;
  description: string;
  frequency: number;
  success_rate: number;
  map_control_gained: number; // 0-1
  economic_efficiency: number; // 0-1
}

export interface RetakePattern {
  pattern_id: string;
  site: string;
  frequency: number;
  success_rate: number;
  avg_time_to_site: number;
  utility_usage: UtilityUsage;
  positioning: 'split' | 'stack' | 'isolated';
}

export interface PatternRecommendation {
  type: 'execute' | 'default' | 'retake' | 'economy';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_items: string[];
  expected_impact: string;
}

class PatternRecognitionService {
  /**
   * Analyze patterns across multiple rounds/matches
   */
  analyzePatterns(
    enrichedData: EnrichedGridData[],
    syncEvents: TeamSyncEvent[],
    roundPackets: GridDataPacket[][]
  ): PatternAnalysisResult {
    const teamCoordination = this.analyzeTeamCoordination(enrichedData, syncEvents);
    const executePatterns = this.identifyExecutePatterns(enrichedData, syncEvents);
    const defaultPatterns = this.identifyDefaultPatterns(enrichedData);
    const retakePatterns = this.identifyRetakePatterns(enrichedData, syncEvents);
    const recommendations = this.generateRecommendations(
      teamCoordination,
      executePatterns,
      defaultPatterns,
      retakePatterns
    );

    return {
      team_coordination: teamCoordination,
      execute_patterns: executePatterns,
      default_patterns: defaultPatterns,
      retake_patterns: retakePatterns,
      recommendations,
    };
  }

  /**
   * Analyze overall team coordination
   */
  private analyzeTeamCoordination(
    enrichedData: EnrichedGridData[],
    syncEvents: TeamSyncEvent[]
  ): TeamCoordinationScore {
    // Calculate utility timing score
    const utilityTiming = this.calculateUtilityTiming(syncEvents);

    // Calculate trade efficiency
    const tradeEfficiency = this.calculateTradeEfficiency(enrichedData);

    // Calculate positioning sync
    const positioningSync = this.calculatePositioningSync(enrichedData);

    // Infer communication quality from coordination
    const communicationQuality = (utilityTiming + tradeEfficiency + positioningSync) / 3;

    // Identify breakdowns
    const breakdowns = this.identifyCoordinationBreakdowns(enrichedData, syncEvents);

    const overallScore = (utilityTiming + tradeEfficiency + positioningSync + communicationQuality) / 4;

    return {
      overall_score: overallScore,
      utility_timing: utilityTiming,
      trade_efficiency: tradeEfficiency,
      positioning_sync: positioningSync,
      communication_quality: communicationQuality,
      breakdowns,
    };
  }

  /**
   * Calculate utility timing score
   */
  private calculateUtilityTiming(syncEvents: TeamSyncEvent[]): number {
    if (syncEvents.length === 0) return 0.5;

    const executeEvents = syncEvents.filter((e) => e.event_type === 'execute');
    if (executeEvents.length === 0) return 0.5;

    const avgTiming = executeEvents.reduce(
      (sum, e) => sum + e.details.utility_timing,
      0
    ) / executeEvents.length;

    return avgTiming;
  }

  /**
   * Calculate trade efficiency
   */
  private calculateTradeEfficiency(enrichedData: EnrichedGridData[]): number {
    // Simplified: check how often kills happen in quick succession
    // In real implementation, would analyze kill timestamps
    return 0.65; // Placeholder
  }

  /**
   * Calculate positioning synchronization
   */
  private calculatePositioningSync(enrichedData: EnrichedGridData[]): number {
    if (enrichedData.length < 2) return 0.5;

    // Check if players are positioned to support each other
    // Simplified: check if players are within reasonable distance during executes
    return 0.7; // Placeholder
  }

  /**
   * Identify coordination breakdowns
   */
  private identifyCoordinationBreakdowns(
    enrichedData: EnrichedGridData[],
    syncEvents: TeamSyncEvent[]
  ): CoordinationBreakdown[] {
    const breakdowns: CoordinationBreakdown[] = [];

    for (const event of syncEvents) {
      if (event.coordination_score < 0.5) {
        // Low coordination = breakdown
        let type: CoordinationBreakdown['type'];
        if (event.details.utility_timing < 0.4) {
          type = 'utility_miss';
        } else if (event.details.trade_efficiency < 0.4) {
          type = 'trade_fail';
        } else if (event.details.positioning_score < 0.4) {
          type = 'positioning_error';
        } else {
          type = 'timing_issue';
        }

        breakdowns.push({
          timestamp: event.timestamp,
          type,
          players_involved: event.players_involved,
          description: `Coordination breakdown during ${event.event_type}`,
          impact: event.coordination_score < 0.3 ? 'high' : 'medium',
        });
      }
    }

    return breakdowns;
  }

  /**
   * Identify execute patterns
   */
  private identifyExecutePatterns(
    enrichedData: EnrichedGridData[],
    syncEvents: TeamSyncEvent[]
  ): ExecutePattern[] {
    const patterns: ExecutePattern[] = [];
    const executeEvents = syncEvents.filter((e) => e.event_type === 'execute');

    // Group by site (would need map data)
    const siteGroups = this.groupBySite(executeEvents, enrichedData);

    for (const [site, events] of Object.entries(siteGroups)) {
      const successCount = events.filter((e) => e.success).length;
      const successRate = successCount / events.length;

      patterns.push({
        pattern_id: `execute-${site}`,
        site,
        frequency: events.length,
        success_rate: successRate,
        avg_duration: events.reduce((sum, e) => sum + e.window_duration, 0) / events.length,
        utility_usage: {
          smokes: 2, // Would calculate from actual data
          flashes: 1,
          molotovs: 1,
          recon: 0,
          timing_score: events.reduce((sum, e) => sum + e.details.utility_timing, 0) / events.length,
        },
        player_roles: {}, // Would extract from player data
        weaknesses: successRate < 0.5 ? ['Poor utility timing', 'Weak entry'] : [],
        strengths: successRate > 0.7 ? ['Good coordination', 'Effective utility'] : [],
      });
    }

    return patterns;
  }

  /**
   * Identify default patterns
   */
  private identifyDefaultPatterns(enrichedData: EnrichedGridData[]): DefaultPattern[] {
    // Analyze early round behavior
    const defaultPatterns: DefaultPattern[] = [];

    // Simplified: would analyze map control, positioning, etc.
    defaultPatterns.push({
      pattern_id: 'default-1',
      description: 'Standard default with map control',
      frequency: 0.6,
      success_rate: 0.55,
      map_control_gained: 0.5,
      economic_efficiency: 0.7,
    });

    return defaultPatterns;
  }

  /**
   * Identify retake patterns
   */
  private identifyRetakePatterns(
    enrichedData: EnrichedGridData[],
    syncEvents: TeamSyncEvent[]
  ): RetakePattern[] {
    const patterns: RetakePattern[] = [];
    const retakeEvents = syncEvents.filter((e) => e.event_type === 'retake');

    const siteGroups = this.groupBySite(retakeEvents, enrichedData);

    for (const [site, events] of Object.entries(siteGroups)) {
      const successCount = events.filter((e) => e.success).length;
      const successRate = successCount / events.length;

      patterns.push({
        pattern_id: `retake-${site}`,
        site,
        frequency: events.length,
        success_rate: successRate,
        avg_time_to_site: 5.0, // Would calculate from actual data
        utility_usage: {
          smokes: 1,
          flashes: 2,
          molotovs: 0,
          recon: 1,
          timing_score: events.reduce((sum, e) => sum + e.details.utility_timing, 0) / events.length,
        },
        positioning: 'split', // Would analyze from positioning data
      });
    }

    return patterns;
  }

  /**
   * Group events by site
   */
  private groupBySite(
    events: TeamSyncEvent[],
    enrichedData: EnrichedGridData[]
  ): Record<string, TeamSyncEvent[]> {
    const groups: Record<string, TeamSyncEvent[]> = {};

    for (const event of events) {
      // Find corresponding packet to get site info
      const packet = enrichedData.find(
        (e) => Math.abs((e.raw_data as GridDataPacket).timestamp - event.timestamp) < 1000
      );

      if (packet) {
        const context = (packet.raw_data as GridDataPacket).match_context;
        const site = context.site_control || 'Unknown';
        if (!groups[site]) groups[site] = [];
        groups[site].push(event);
      }
    }

    return groups;
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(
    coordination: TeamCoordinationScore,
    executes: ExecutePattern[],
    defaults: DefaultPattern[],
    retakes: RetakePattern[]
  ): PatternRecommendation[] {
    const recommendations: PatternRecommendation[] = [];

    // Coordination recommendations
    if (coordination.utility_timing < 0.6) {
      recommendations.push({
        type: 'execute',
        priority: 'high',
        title: 'Improve Utility Timing',
        description: 'Utility usage is not synchronized with executes, reducing effectiveness',
        action_items: [
          'Practice utility timing in scrims',
          'Establish clear utility callouts',
          'Review successful executes to identify timing patterns',
        ],
        expected_impact: 'Increase execute success rate by 15-20%',
      });
    }

    // Execute pattern recommendations
    const lowSuccessExecutes = executes.filter((e) => e.success_rate < 0.5);
    if (lowSuccessExecutes.length > 0) {
      recommendations.push({
        type: 'execute',
        priority: 'high',
        title: 'Revise Low-Success Execute Patterns',
        description: `${lowSuccessExecutes.length} execute pattern(s) have success rate below 50%`,
        action_items: [
          'Analyze failed executes to identify common failure points',
          'Adjust utility usage and timing',
          'Consider alternative entry strategies',
        ],
        expected_impact: 'Improve round win probability on executes',
      });
    }

    // Retake recommendations
    const lowSuccessRetakes = retakes.filter((r) => r.success_rate < 0.4);
    if (lowSuccessRetakes.length > 0) {
      recommendations.push({
        type: 'retake',
        priority: 'medium',
        title: 'Improve Retake Coordination',
        description: 'Retake success rate is low, indicating coordination issues',
        action_items: [
          'Practice retake scenarios',
          'Improve utility usage on retakes',
          'Work on split positioning and timing',
        ],
        expected_impact: 'Increase retake success rate by 10-15%',
      });
    }

    return recommendations;
  }
}

export const patternRecognition = new PatternRecognitionService();


