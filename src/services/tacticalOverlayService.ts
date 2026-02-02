// Tactical Overlay Service
// Generates real-time tactical overlay data with proactive insights for Category 1 requirements

import type { GridDataPacket } from '@/types/grid';
import type { TacticalOverlayData } from '@/components/dashboard/TacticalOverlay';
import type { Insight } from '@/types';
import { predictiveAnalytics, type PredictiveAnalysisResult } from './predictiveAnalytics';
import { assistantCoach, type AssistantCoachAnalysis } from './assistantCoach';

export class TacticalOverlayService {
  /**
   * Generate comprehensive tactical overlay data with proactive insights
   * This is the core service for Category 1: Real-Time Tactical Overlay
   */
  async generateTacticalOverlay(
    recentPackets: GridDataPacket[],
    previousAnalysis?: AssistantCoachAnalysis
  ): Promise<TacticalOverlayData> {
    // Get live insights from assistant coach
    const liveInsights = await assistantCoach.getLiveInsights(recentPackets, previousAnalysis);

    // Extract current phase and coordination
    const currentPhase = this.extractCurrentPhase(recentPackets);
    const teamCoordination = this.calculateTeamCoordination(recentPackets);

    // Generate key events
    const keyEvents = this.extractKeyEvents(recentPackets);

    // Generate predicted actions with time windows
    const predictedActions = this.generatePredictedActions(recentPackets);

    // Generate proactive predictive insights
    const predictiveInsights = await this.generatePredictiveInsights(recentPackets, previousAnalysis);

    // Generate micro-macro correlation alerts
    const microMacroAlerts = await this.generateMicroMacroAlerts(recentPackets, previousAnalysis);

    return {
      current_phase: currentPhase,
      team_coordination: teamCoordination,
      key_events: keyEvents,
      predicted_actions: predictedActions,
      alerts: liveInsights.alerts,
      predictive_insights: predictiveInsights,
      micro_macro_alerts: microMacroAlerts,
    };
  }

  /**
   * Extract current round phase from packets
   */
  private extractCurrentPhase(packets: GridDataPacket[]): string {
    if (packets.length === 0) return 'pre_round';
    const latest = packets[packets.length - 1];
    return latest.match_context.round_phase || 'mid_round';
  }

  /**
   * Calculate team coordination score
   */
  private calculateTeamCoordination(packets: GridDataPacket[]): number {
    if (packets.length === 0) return 0.5;

    // Analyze coordination indicators
    const teamPackets = packets.filter((p) => p.player.team === 'Attacker');
    if (teamPackets.length < 2) return 0.5;

    // Check for synchronized actions (simplified heuristic)
    let coordinationScore = 0.5;

    // Check utility timing (if multiple players use utility in similar time window)
    const utilityEvents = teamPackets.filter((p) => {
      const abilities = p.inventory.abilities;
      return Object.values(abilities).some((a) => a && a.charges < 1);
    });

    if (utilityEvents.length > 1) {
      coordinationScore += 0.15; // Good utility coordination
    }

    // Check positioning spread (team spread vs clustered)
    const positions = teamPackets.map((p) => p.player.position);
    const avgDistance = this.calculateAverageDistance(positions);
    if (avgDistance > 500 && avgDistance < 2000) {
      coordinationScore += 0.1; // Good positioning spread
    }

    // Check movement synchronization
    const movingPlayers = teamPackets.filter((p) => p.player.is_moving).length;
    const movementSync = movingPlayers / teamPackets.length;
    if (movementSync > 0.3 && movementSync < 0.7) {
      coordinationScore += 0.1; // Balanced movement
    }

    return Math.min(1, Math.max(0, coordinationScore));
  }

  /**
   * Calculate average distance between positions
   */
  private calculateAverageDistance(positions: Array<{ x: number; y: number; z: number }>): number {
    if (positions.length < 2) return 0;

    let totalDistance = 0;
    let pairs = 0;

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.sqrt(
          Math.pow(positions[i].x - positions[j].x, 2) +
          Math.pow(positions[i].y - positions[j].y, 2) +
          Math.pow(positions[i].z - positions[j].z, 2)
        );
        totalDistance += dist;
        pairs++;
      }
    }

    return pairs > 0 ? totalDistance / pairs : 0;
  }

  /**
   * Extract key events from recent packets
   */
  private extractKeyEvents(packets: GridDataPacket[]): Array<{
    timestamp: number;
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const events: Array<{
      timestamp: number;
      type: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    for (const packet of packets.slice(-10)) {
      // Detect spike plant
      if (packet.match_context.spike_status === 'planted' && packet.match_context.spike_plant_time) {
        events.push({
          timestamp: packet.timestamp,
          type: 'objective',
          description: 'Spike planted',
          impact: 'high',
        });
      }

      // Detect ability usage
      const abilities = packet.inventory.abilities;
      for (const [key, ability] of Object.entries(abilities)) {
        if (ability && ability.charges < 1) {
          events.push({
            timestamp: packet.timestamp,
            type: 'ability',
            description: `${ability.name} used`,
            impact: 'medium',
          });
        }
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }

  /**
   * Generate predicted actions with time windows
   */
  private generatePredictedActions(packets: GridDataPacket[]): Array<{
    action: string;
    confidence: number;
    player_id: string;
    player_name?: string;
    time_window?: string;
  }> {
    if (packets.length === 0) return [];

    const predictions: Array<{
      action: string;
      confidence: number;
      player_id: string;
      player_name?: string;
      time_window?: string;
    }> = [];

    const latest = packets[packets.length - 1];
    const context = latest.match_context;

    // Predict based on game state
    if (context.round_phase === 'post_plant') {
      predictions.push({
        action: 'Defender retake attempt',
        confidence: 0.75,
        player_id: 'team',
        time_window: 'next 15s',
      });
    }

    if (context.round_phase === 'mid_round' && context.site_control === 'Contested') {
      predictions.push({
        action: 'Site execute',
        confidence: 0.65,
        player_id: latest.player.id,
        time_window: 'next 10s',
      });
    }

    return predictions;
  }

  /**
   * Generate proactive predictive insights
   * This is a key Category 1 feature: "What will happen and how to prevent it"
   */
  private async generatePredictiveInsights(
    packets: GridDataPacket[],
    previousAnalysis?: AssistantCoachAnalysis
  ): Promise<Array<{
    type: 'opponent_strategy' | 'economic_decision' | 'fatigue_warning' | 'pattern_detection';
    title: string;
    description: string;
    confidence: number;
    recommendation: string;
    urgency: 'high' | 'medium' | 'low';
  }>> {
    const insights: Array<{
      type: 'opponent_strategy' | 'economic_decision' | 'fatigue_warning' | 'pattern_detection';
      title: string;
      description: string;
      confidence: number;
      recommendation: string;
      urgency: 'high' | 'medium' | 'low';
    }> = [];

    if (!previousAnalysis) return insights;

    // Extract opponent strategy predictions
    const strategyPredictions = previousAnalysis.predictive_analysis.strategy_predictions;
    for (const prediction of strategyPredictions.slice(0, 2)) {
      insights.push({
        type: 'opponent_strategy',
        title: `Opponent Strategy Detected`,
        description: `${prediction.predicted_strategy} (${Math.round(prediction.confidence * 100)}% confidence)`,
        confidence: prediction.confidence,
        recommendation: prediction.counter_strategy,
        urgency: prediction.expected_outcome === 'unfavorable' ? 'high' : 'medium',
      });
    }

    // Extract economic predictions
    const economicPredictions = previousAnalysis.predictive_analysis.economic_predictions;
    for (const prediction of economicPredictions.slice(0, 1)) {
      insights.push({
        type: 'economic_decision',
        title: `Economic Recommendation`,
        description: `Recommended ${prediction.recommended_buy} for next round (${Math.round(prediction.win_probability * 100)}% win probability)`,
        confidence: 0.8,
        recommendation: prediction.reasoning,
        urgency: prediction.risk_assessment === 'high' ? 'high' : 'medium',
      });
    }

    // Extract fatigue warnings
    const fatigueAnalysis = previousAnalysis.predictive_analysis.player_fatigue_analysis;
    for (const analysis of fatigueAnalysis.filter((a) => a.fatigue_score > 0.7)) {
      insights.push({
        type: 'fatigue_warning',
        title: `Player Fatigue Alert`,
        description: `Player showing signs of decision fatigue (${Math.round(analysis.fatigue_score * 100)}% fatigue score)`,
        confidence: 0.75,
        recommendation: analysis.recommendations[0] || 'Monitor decision quality',
        urgency: 'high',
      });
    }

    // Extract pattern detections
    const opponentPatterns = previousAnalysis.predictive_analysis.opponent_patterns;
    for (const pattern of opponentPatterns.slice(0, 1)) {
      insights.push({
        type: 'pattern_detection',
        title: `Opponent Pattern Identified`,
        description: pattern.prediction,
        confidence: pattern.frequency,
        recommendation: pattern.counter_strategy,
        urgency: pattern.frequency > 0.7 ? 'high' : 'medium',
      });
    }

    return insights;
  }

  /**
   * Generate micro-macro correlation alerts
   * This directly fulfills Category 1 requirement: "explicitly linking individual error to team strategy"
   */
  private async generateMicroMacroAlerts(
    packets: GridDataPacket[],
    previousAnalysis?: AssistantCoachAnalysis
  ): Promise<Array<{
    micro_action: string;
    macro_risk: string;
    correlation_strength: number;
    recommendation: string;
  }>> {
    const alerts: Array<{
      micro_action: string;
      macro_risk: string;
      correlation_strength: number;
      recommendation: string;
    }> = [];

    if (!previousAnalysis) return alerts;

    // Extract high-impact micro-macro correlations
    const correlations = previousAnalysis.predictive_analysis.micro_macro_correlations
      .filter((c) => c.correlation_strength > 0.5 && c.confidence > 0.6)
      .slice(0, 3);

    for (const correlation of correlations) {
      alerts.push({
        micro_action: correlation.micro_action,
        macro_risk: correlation.macro_outcome,
        correlation_strength: correlation.correlation_strength,
        recommendation: correlation.recommendation,
      });
    }

    return alerts;
  }
}

export const tacticalOverlayService = new TacticalOverlayService();


