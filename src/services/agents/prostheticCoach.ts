// Prosthetic Coach (Real-Time) Agent
// Acts as a real-time co-pilot during scrims or review
// Provides tactical suggestions and pattern alerts

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentOutput,
  AgentTool,
  ProstheticCoachOutput,
  RealTimeSuggestion,
  PatternAlert,
  TacticalWhisper,
} from '@/types/agents';
import type { GridDataPacket } from '@/types/grid';
import { assistantCoach } from '../assistantCoach';

export class ProstheticCoachAgent extends BaseAgentImpl {
  name = 'Prosthetic Coach (Real-Time)';
  role = 'prosthetic_coach' as const;
  description =
    'Provides real-time tactical suggestions during live matches or scrims. Acts as a co-pilot that whispers tactical advice and alerts to detected patterns.';

  private patternHistory: Map<string, number[]> = new Map();
  private lastAnalysisTime: number = 0;

  /**
   * Execute real-time coaching analysis
   */
  async execute(input: AgentInput): Promise<ProstheticCoachOutput> {
    const gridData = input.grid_data || [];
    const liveFeed = input.live_feed || false;

    if (gridData.length === 0) {
      throw new Error('No GRID data provided to Prosthetic Coach');
    }

    // Step 1: Get live insights from assistant coach
    const liveInsights = await assistantCoach.getLiveInsights(
      gridData,
      input.previous_analysis
    );

    // Step 2: Generate real-time suggestions
    const realTimeSuggestions = await this.generateRealTimeSuggestions(
      gridData,
      liveInsights,
      liveFeed
    );

    // Step 3: Detect pattern alerts
    const patternAlerts = await this.detectPatternAlerts(
      gridData,
      liveInsights
    );

    // Step 4: Generate tactical whispers
    const tacticalWhispers = await this.generateTacticalWhispers(
      gridData,
      liveInsights,
      realTimeSuggestions
    );

    // Step 5: Build insights
    const insights = [
      ...realTimeSuggestions.map((s) => ({
        id: s.suggestion_id,
        type: 'tactical' as const,
        title: `${s.type}: ${s.message}`,
        description: `Urgency: ${s.urgency}`,
        severity: s.urgency === 'high' ? 0.9 : s.urgency === 'medium' ? 0.6 : 0.3,
        player_id: s.player_target,
        actionable: true,
        related_data: s,
      })),
      ...patternAlerts.map((a) => ({
        id: a.alert_id,
        type: 'pattern' as const,
        title: `Pattern Alert: ${a.pattern_type}`,
        description: a.description,
        severity: a.confidence,
        actionable: a.action_required,
        related_data: a,
      })),
    ];

    const recommendations = [
      ...realTimeSuggestions
        .filter((s) => s.urgency === 'high')
        .map((s) => s.message),
      ...patternAlerts
        .filter((a) => a.action_required)
        .map((a) => a.description),
    ];

    return {
      ...this.createBaseOutput(insights, recommendations, 0.88),
      real_time_suggestions: realTimeSuggestions,
      pattern_alerts: patternAlerts,
      tactical_whispers: tacticalWhispers,
    };
  }

  /**
   * Generate real-time tactical suggestions
   */
  private async generateRealTimeSuggestions(
    gridData: GridDataPacket[],
    liveInsights: any,
    liveFeed: boolean
  ): Promise<RealTimeSuggestion[]> {
    const suggestions: RealTimeSuggestion[] = [];

    // Analyze recent packets (last 5 seconds of data)
    const recentPackets = gridData.slice(-10);
    const currentPacket = recentPackets[recentPackets.length - 1];

    if (!currentPacket) {
      return suggestions;
    }

    const context = currentPacket.match_context;
    const player = currentPacket.player;

    // Generate suggestions based on game state
    if (context.spike_status === 'planted' && player.team === 'Defender') {
      suggestions.push({
        suggestion_id: `suggestion-${Date.now()}-retake`,
        timestamp: Date.now(),
        type: 'tactical',
        message: 'Spike planted - coordinate retake with team utility',
        urgency: 'high',
      });
    }

    // Check utility levels
    const abilities = currentPacket.inventory.abilities;
    const utilityCount = Object.values(abilities).filter(
      (a) => a && a.charges > 0
    ).length;

    if (utilityCount === 0 && context.round_time_remaining && context.round_time_remaining > 30) {
      suggestions.push({
        suggestion_id: `suggestion-${Date.now()}-utility`,
        timestamp: Date.now(),
        type: 'utility',
        message: 'Low on utility - consider saving or coordinating with team',
        urgency: 'medium',
      });
    }

    // Check economy
    if (currentPacket.inventory.credits < 2000 && context.round_phase === 'pre_round') {
      suggestions.push({
        suggestion_id: `suggestion-${Date.now()}-economy`,
        timestamp: Date.now(),
        type: 'economy',
        message: 'Low economy - coordinate save or force buy with team',
        urgency: 'medium',
      });
    }

    // Check positioning
    if (!player.is_moving && !player.is_crouching && context.round_phase === 'mid_round') {
      suggestions.push({
        suggestion_id: `suggestion-${Date.now()}-positioning`,
        timestamp: Date.now(),
        type: 'positioning',
        message: 'Consider repositioning to avoid predictable angles',
        urgency: 'low',
        player_target: player.id,
      });
    }

    // Use LLM for advanced suggestions
    if (liveFeed && recentPackets.length > 5) {
      const llmPrompt = this.buildRealTimePrompt(recentPackets, context);
      const llmResponse = await this.callLLM(
        llmPrompt,
        'You are a real-time esports coach. Provide brief, actionable tactical suggestions based on current game state.'
      );

      // Parse LLM response into suggestions
      if (llmResponse.includes('push') || llmResponse.includes('aggressive')) {
        suggestions.push({
          suggestion_id: `suggestion-${Date.now()}-llm`,
          timestamp: Date.now(),
          type: 'tactical',
          message: llmResponse.substring(0, 100), // Truncate for brevity
          urgency: 'medium',
        });
      }
    }

    return suggestions;
  }

  /**
   * Build real-time prompt for LLM
   */
  private buildRealTimePrompt(
    recentPackets: GridDataPacket[],
    context: any
  ): string {
    return `Analyze current game state and provide tactical suggestion:

Round Phase: ${context.round_phase}
Spike Status: ${context.spike_status}
Time Remaining: ${context.round_time_remaining}s
Site Control: ${context.site_control}
Alive Players: ${context.player_locations_alive?.length || 0}

Recent Events: ${recentPackets.length} data packets

Provide ONE brief tactical suggestion (max 50 words).`;
  }

  /**
   * Detect pattern alerts
   */
  private async detectPatternAlerts(
    gridData: GridDataPacket[],
    liveInsights: any
  ): Promise<PatternAlert[]> {
    const alerts: PatternAlert[] = [];

    // Track patterns over time
    const recentPackets = gridData.slice(-20);

    // Detect predictable positioning pattern
    const positionPattern = this.detectPositionPattern(recentPackets);
    if (positionPattern.detected) {
      alerts.push({
        alert_id: `alert-${Date.now()}-position`,
        pattern_type: 'predictable_positioning',
        description: `Player holding same position for ${positionPattern.duration}s - risk of being pre-aimed`,
        detected_at: Date.now(),
        confidence: positionPattern.confidence,
        action_required: true,
      });
    }

    // Detect utility usage pattern
    const utilityPattern = this.detectUtilityPattern(recentPackets);
    if (utilityPattern.detected) {
      alerts.push({
        alert_id: `alert-${Date.now()}-utility`,
        pattern_type: 'utility_timing',
        description: utilityPattern.description,
        detected_at: Date.now(),
        confidence: utilityPattern.confidence,
        action_required: utilityPattern.action_required,
      });
    }

    // Check for high-priority alerts from live insights
    if (liveInsights.alerts) {
      for (const alert of liveInsights.alerts) {
        if (alert.priority === 'high') {
          alerts.push({
            alert_id: `alert-${Date.now()}-insight`,
            pattern_type: alert.type,
            description: alert.description,
            detected_at: Date.now(),
            confidence: 0.8,
            action_required: alert.actionable,
          });
        }
      }
    }

    return alerts;
  }

  /**
   * Detect position pattern
   */
  private detectPositionPattern(
    packets: GridDataPacket[]
  ): { detected: boolean; duration: number; confidence: number } {
    if (packets.length < 5) {
      return { detected: false, duration: 0, confidence: 0 };
    }

    const playerPositions = packets.map((p) => ({
      id: p.player.id,
      position: p.player.position,
      timestamp: p.timestamp,
    }));

    // Check if same player is in similar position
    const positionGroups = new Map<string, number[]>();
    for (const pos of playerPositions) {
      const key = `${pos.id}-${Math.round(pos.position.x / 100)}-${Math.round(pos.position.y / 100)}`;
      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(pos.timestamp);
    }

    // Find longest duration
    let maxDuration = 0;
    for (const timestamps of positionGroups.values()) {
      if (timestamps.length >= 3) {
        const duration = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000;
        maxDuration = Math.max(maxDuration, duration);
      }
    }

    return {
      detected: maxDuration > 5, // 5 seconds in same position
      duration: maxDuration,
      confidence: Math.min(1, maxDuration / 10),
    };
  }

  /**
   * Detect utility pattern
   */
  private detectUtilityPattern(
    packets: GridDataPacket[]
  ): {
    detected: boolean;
    description: string;
    confidence: number;
    action_required: boolean;
  } {
    // Check utility usage timing
    const utilityUsage = packets.filter((p) => {
      const abilities = p.inventory.abilities;
      return Object.values(abilities).some((a) => a && a.charges === 0);
    });

    if (utilityUsage.length === 0) {
      return {
        detected: false,
        description: '',
        confidence: 0,
        action_required: false,
      };
    }

    const context = packets[packets.length - 1]?.match_context;
    if (context && context.round_time_remaining && context.round_time_remaining < 20) {
      // Utility used late in round
      return {
        detected: true,
        description: 'Utility being used late in round - consider earlier timing',
        confidence: 0.7,
        action_required: true,
      };
    }

    return {
      detected: false,
      description: '',
      confidence: 0,
      action_required: false,
    };
  }

  /**
   * Generate tactical whispers
   */
  private async generateTacticalWhispers(
    gridData: GridDataPacket[],
    liveInsights: any,
    suggestions: RealTimeSuggestion[]
  ): Promise<TacticalWhisper[]> {
    const whispers: TacticalWhisper[] = [];

    // Generate whispers from high-priority suggestions
    for (const suggestion of suggestions.filter((s) => s.urgency === 'high')) {
      whispers.push({
        whisper_id: `whisper-${suggestion.suggestion_id}`,
        timestamp: suggestion.timestamp,
        message: suggestion.message,
        context: `Real-time ${suggestion.type} suggestion`,
        priority: 0.9,
      });
    }

    // Generate whispers from recommendations
    if (liveInsights.recommendations) {
      for (const rec of liveInsights.recommendations.slice(0, 2)) {
        whispers.push({
          whisper_id: `whisper-${Date.now()}-rec`,
          timestamp: Date.now(),
          message: rec,
          context: 'Live coaching recommendation',
          priority: 0.7,
        });
      }
    }

    // Use LLM for contextual whispers
    if (gridData.length > 10) {
      const recentPackets = gridData.slice(-10);
      const context = recentPackets[recentPackets.length - 1]?.match_context;

      if (context) {
        const whisperPrompt = `Generate a brief tactical whisper (max 30 words) for:

Round Phase: ${context.round_phase}
Spike: ${context.spike_status}
Time: ${context.round_time_remaining}s

Provide ONE concise tactical tip.`;

        const llmWhisper = await this.callLLM(
          whisperPrompt,
          'You are a real-time esports coach. Provide brief tactical whispers.'
        );

        whispers.push({
          whisper_id: `whisper-${Date.now()}-llm`,
          timestamp: Date.now(),
          message: llmWhisper.substring(0, 100),
          context: 'AI-generated tactical insight',
          priority: 0.6,
        });
      }
    }

    return whispers;
  }

  /**
   * Get tools available to this agent
   */
  getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_live_feed',
        description: 'Analyzes live GRID data feed for real-time insights',
        input_schema: {
          type: 'object',
          properties: {
            grid_packets: { type: 'array' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { analyzed: true };
        },
      },
      {
        name: 'detect_pattern',
        description: 'Detects recurring patterns in live gameplay',
        input_schema: {
          type: 'object',
          properties: {
            recent_data: { type: 'array' },
            pattern_type: { type: 'string' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { pattern_detected: true };
        },
      },
      {
        name: 'generate_tactical_suggestion',
        description: 'Generates real-time tactical suggestion based on game state',
        input_schema: {
          type: 'object',
          properties: {
            game_state: { type: 'object' },
            context: { type: 'object' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { suggestion: 'Coordinate utility usage' };
        },
      },
    ];
  }
}


