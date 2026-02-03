// GRID Data Ingestion & Enrichment Service
// Processes official GRID esports data and enriches it with tactical context

import type { GridDataPacket } from '@/types/grid';
import { GridValidator, GridValidationError } from '@/types/grid';
import type { EnrichedGridData, TacticalContextLayer, EmotionalInference, BiomechanicalData, EmotionalState } from '@/types/tactical';

export class GridIngestionError extends Error {
  constructor(
    message: string,
    public readonly packetIndex?: number,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'GridIngestionError';
  }
}

export interface GridIngestionResult {
  enriched: EnrichedGridData[];
  round_summary: RoundSummary;
  team_sync_events: TeamSyncEvent[];
}

export interface RoundSummary {
  round_number: number;
  winner: 'Attacker' | 'Defender';
  win_type: 'elimination' | 'defuse' | 'time' | 'plant';
  economy_state: 'full_buy' | 'force' | 'eco' | 'semi';
  duration: number;
  key_events: KeyEvent[];
}

export interface KeyEvent {
  timestamp: number;
  type: 'kill' | 'ability' | 'plant' | 'defuse' | 'economy_shift';
  player_id: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface TeamSyncEvent {
  timestamp: number;
  window_duration: number; // seconds
  players_involved: string[];
  event_type: 'execute' | 'retake' | 'default' | 'save';
  coordination_score: number; // 0-1
  success: boolean;
  details: {
    utility_timing: number; // 0-1, how well utility was timed
    trade_efficiency: number; // 0-1, how well trades happened
    positioning_score: number; // 0-1, how well positioned
  };
}

class GridIngestionService {
  /**
   * Process raw GRID data packets and enrich with tactical context
   */
  processGridData(packets: GridDataPacket[]): GridIngestionResult {
    // Validate input
    if (!Array.isArray(packets)) {
      throw new GridIngestionError('packets must be an array');
    }

    if (packets.length === 0) {
      throw new GridIngestionError('packets array cannot be empty');
    }

    // Validate all packets
    const invalidPackets: number[] = [];
    packets.forEach((packet, index) => {
      try {
        GridValidator.validateGridDataPacket(packet);
      } catch (error) {
        invalidPackets.push(index);
        if (error instanceof GridValidationError) {
          console.error(`Invalid packet at index ${index}:`, error.message);
        }
      }
    });

    if (invalidPackets.length > 0) {
      throw new GridIngestionError(
        `Found ${invalidPackets.length} invalid packet(s) at indices: ${invalidPackets.join(', ')}`,
        invalidPackets[0]
      );
    }

    const enriched: EnrichedGridData[] = [];
    const teamSyncEvents: TeamSyncEvent[] = [];
    const errors: Error[] = [];

    try {
      // Group packets by round
      const rounds = this.groupByRound(packets);

      if (rounds.length === 0) {
        throw new GridIngestionError('No rounds found after grouping packets');
      }

      for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
        const currentRoundPackets = rounds[roundIndex];
        
        if (!currentRoundPackets || currentRoundPackets.length === 0) {
          console.warn(`Round ${roundIndex} has no packets, skipping`);
          continue;
        }

        // Enrich each packet
        for (let packetIndex = 0; packetIndex < currentRoundPackets.length; packetIndex++) {
          const packet = currentRoundPackets[packetIndex];
          if (!packet) continue;
          try {
            enriched.push(this.enrichPacket(packet, currentRoundPackets));
          } catch (error) {
            errors.push(
              new GridIngestionError(
                `Failed to enrich packet at round ${roundIndex}, packet ${packetIndex}: ${error instanceof Error ? error.message : String(error)}`,
                packetIndex,
                error instanceof Error ? error : undefined
              )
            );
            // Continue processing other packets
            console.error(`Error enriching packet:`, error);
          }
        }

        // Detect team sync events
        try {
          const syncEvents = this.detectTeamSyncEvents(currentRoundPackets);
          teamSyncEvents.push(...syncEvents);
        } catch (error) {
          errors.push(
            new GridIngestionError(
              `Failed to detect team sync events for round ${roundIndex}: ${error instanceof Error ? error.message : String(error)}`,
              undefined,
              error instanceof Error ? error : undefined
            )
          );
          console.error(`Error detecting team sync events:`, error);
        }
      }

      // Generate round summary
      let roundSummary: RoundSummary;
      try {
        roundSummary = this.generateRoundSummary(packets);
      } catch (error) {
        throw new GridIngestionError(
          `Failed to generate round summary: ${error instanceof Error ? error.message : String(error)}`,
          undefined,
          error instanceof Error ? error : undefined
        );
      }

      // If we have too many errors, throw
      if (errors.length > packets.length * 0.5) {
        throw new GridIngestionError(
          `Too many errors during processing: ${errors.length} errors for ${packets.length} packets`,
          undefined
        );
      }

      // Log warnings for errors but continue
      if (errors.length > 0) {
        console.warn(`Processed with ${errors.length} error(s):`, errors);
      }

      return {
        enriched,
        round_summary: roundSummary,
        team_sync_events: teamSyncEvents,
      };
    } catch (error) {
      if (error instanceof GridIngestionError) {
        throw error;
      }
      throw new GridIngestionError(
        `Failed to process grid data: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Enrich a single GRID packet with tactical context
   */
  private enrichPacket(
    packet: GridDataPacket,
    roundPackets: GridDataPacket[]
  ): EnrichedGridData {
    if (!packet) {
      throw new GridIngestionError('Packet is required');
    }

    if (!Array.isArray(roundPackets)) {
      throw new GridIngestionError('roundPackets must be an array');
    }

    let tacticalContext: TacticalContextLayer;
    let emotionalInference: EmotionalInference;
    let biomechanicalData: BiomechanicalData;

    try {
      tacticalContext = this.inferTacticalContext(packet, roundPackets);
    } catch (error) {
      throw new GridIngestionError(
        `Failed to infer tactical context: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    try {
      emotionalInference = this.inferEmotionalState(packet, roundPackets);
    } catch (error) {
      throw new GridIngestionError(
        `Failed to infer emotional state: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    try {
      biomechanicalData = this.extractBiomechanicalData(packet);
    } catch (error) {
      throw new GridIngestionError(
        `Failed to extract biomechanical data: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    return {
      raw_data: packet,
      tactical_context: tacticalContext,
      emotional_inference: emotionalInference,
      biomechanical_data: biomechanicalData,
    };
  }

  /**
   * Infer tactical context from game state
   */
  private inferTacticalContext(
    packet: GridDataPacket,
    roundPackets: GridDataPacket[]
  ): TacticalContextLayer {
    if (!packet || !packet.match_context || !packet.player) {
      throw new GridIngestionError('Packet missing required fields (match_context or player)');
    }

    const context = packet.match_context;
    const player = packet.player;

    // Determine round type based on economy
    if (!packet.inventory || typeof packet.inventory.credits !== 'number') {
      throw new GridIngestionError('Packet missing inventory.credits');
    }

    const credits = packet.inventory.credits;
    if (credits < 0) {
      throw new GridIngestionError(`Invalid credits value: ${credits}`);
    }

    let roundType: 'pistol' | 'eco' | 'force' | 'full';
    if (context.round_phase === 'pre_round' && credits < 2000) {
      roundType = 'eco';
    } else if (credits < 4000) {
      roundType = 'force';
    } else if (credits >= 4000) {
      roundType = 'full';
    } else {
      roundType = 'pistol';
    }

    // Determine tactical phase
    let tacticalPhase: 'default' | 'execute' | 'retake' | 'save';
    if (context.spike_status === 'planted') {
      tacticalPhase = player.team === 'Defender' ? 'retake' : 'post_plant';
    } else if (context.round_phase === 'mid_round') {
      // Check if multiple players are moving together (execute)
      const teamMates = roundPackets.filter(
        (p) => p.player.team === player.team && p.player.id !== player.id
      );
      const movingTogether = teamMates.filter(
        (p) => p.player.is_moving
      ).length >= 2;
      tacticalPhase = movingTogether ? 'execute' : 'default';
    } else {
      tacticalPhase = 'default';
    }

    // Determine situation type
    const aliveCount = context.player_locations_alive.length;
    const teamAlive = roundPackets.filter(
      (p) => p.player.team === player.team && context.player_locations_alive.includes(p.player.id)
    ).length;
    const enemyAlive = aliveCount - teamAlive;

    let situationType: 'advantage' | 'disadvantage' | 'neutral' | 'clutch';
    if (teamAlive > enemyAlive + 1) {
      situationType = 'advantage';
    } else if (enemyAlive > teamAlive + 1) {
      situationType = 'disadvantage';
    } else if (teamAlive === 1 && enemyAlive > 1) {
      situationType = 'clutch';
    } else {
      situationType = 'neutral';
    }

    // Determine pressure level
    let pressureLevel: 'low' | 'medium' | 'high' | 'critical';
    const timeRemaining = context.round_time_remaining ?? 100;
    
    if (typeof timeRemaining !== 'number' || timeRemaining < 0) {
      throw new GridIngestionError(`Invalid round_time_remaining: ${timeRemaining}`);
    }

    if (timeRemaining < 20 || context.spike_status === 'planted') {
      pressureLevel = 'critical';
    } else if (timeRemaining < 40 || situationType === 'clutch') {
      pressureLevel = 'high';
    } else if (situationType === 'disadvantage') {
      pressureLevel = 'medium';
    } else {
      pressureLevel = 'low';
    }

    return {
      round_type: roundType,
      tactical_phase: tacticalPhase,
      situation_type: situationType,
      pressure_level: pressureLevel,
    };
  }

  /**
   * Infer emotional state from player behavior
   */
  private inferEmotionalState(
    packet: GridDataPacket,
    roundPackets: GridDataPacket[]
  ): EmotionalInference {
    if (!packet || !packet.player || !packet.match_context) {
      throw new GridIngestionError('Packet missing required fields for emotional inference');
    }

    const player = packet.player;
    const context = packet.match_context;
    const indicators: string[] = [];

    // Analyze movement patterns
    const isMovingAggressively = player.is_moving && !player.is_crouching;
    const isCautious = player.is_crouching && !player.is_moving;

    // Analyze health and situation
    const isLowHealth = player.health < 50;
    const isInClutch = context.player_locations_alive.length <= 3;

    let primaryEmotion: EmotionalState;
    let confidence = 0.6;
    let intensity = 0.5;

    if (isMovingAggressively && player.health > 75) {
      primaryEmotion = 'aggressive_confident';
      indicators.push('Fast movement', 'High health');
      intensity = 0.8;
    } else if (isCautious && isLowHealth) {
      primaryEmotion = 'cautious_anticipatory';
      indicators.push('Crouched movement', 'Low health');
      intensity = 0.7;
    } else if (isInClutch && isLowHealth) {
      primaryEmotion = 'focused_pressured';
      indicators.push('Clutch situation', 'Low health');
      intensity = 0.9;
    } else if (player.health > 75 && !isMovingAggressively) {
      primaryEmotion = 'calm_collected';
      indicators.push('High health', 'Controlled movement');
      intensity = 0.6;
    } else {
      primaryEmotion = 'focused_pressured';
      indicators.push('Standard situation');
      intensity = 0.5;
    }

    return {
      primary_emotion: primaryEmotion,
      confidence,
      indicators,
      intensity,
    };
  }

  /**
   * Extract biomechanical data from player state
   */
  private extractBiomechanicalData(packet: GridDataPacket): BiomechanicalData {
    if (!packet || !packet.player || !packet.match_context) {
      throw new GridIngestionError('Packet missing required fields for biomechanical extraction');
    }

    const player = packet.player;
    
    if (typeof player.is_moving !== 'boolean' || typeof player.is_crouching !== 'boolean') {
      throw new GridIngestionError('Player state missing movement flags');
    }

    if (typeof player.health !== 'number' || player.health < 0 || player.health > 100) {
      throw new GridIngestionError(`Invalid player health: ${player.health}`);
    }
    
    // Estimate movement speed (simplified)
    const movementSpeed = player.is_moving 
      ? (player.is_crouching ? 0.3 : 1.0)
      : 0;

    // Estimate fatigue based on round duration and activity
    const roundTime = packet.match_context.round_time_remaining ?? 100;
    
    if (typeof roundTime !== 'number' || roundTime < 0) {
      throw new GridIngestionError(`Invalid round_time_remaining: ${roundTime}`);
    }

    const activityLevel = player.is_moving ? 1 : 0.5;
    const fatigueScore = Math.min(1, Math.max(0, (100 - roundTime) / 100 * activityLevel));

    return {
      movement_speed: movementSpeed,
      fatigue_score: fatigueScore,
      precision_score: player.health > 50 ? 0.8 : 0.5, // Simplified
    };
  }

  /**
   * Detect team synchronization events
   */
  private detectTeamSyncEvents(packets: GridDataPacket[]): TeamSyncEvent[] {
    if (!Array.isArray(packets) || packets.length === 0) {
      return [];
    }

    const events: TeamSyncEvent[] = [];
    const windowSize = 5; // 5 second window

    // Group packets by time windows
    let timeWindows: GridDataPacket[][];
    try {
      timeWindows = this.createTimeWindows(packets, windowSize);
    } catch (error) {
      throw new GridIngestionError(
        `Failed to create time windows: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined
      );
    }

    for (const window of timeWindows) {
      // Check for execute patterns (multiple attackers moving together)
      const attackers = window.filter((p) => p.player.team === 'Attacker');
      const defenders = window.filter((p) => p.player.team === 'Defender');

      if (attackers.length >= 3 && attackers.filter((p) => p.player.is_moving).length >= 2) {
        // Potential execute
        const utilityUsed = attackers.some((p) => 
          Object.values(p.inventory.abilities).some((a) => a && a.charges < 1)
        );

        events.push({
          timestamp: window[0].timestamp,
          window_duration: windowSize,
          players_involved: attackers.map((p) => p.player.id),
          event_type: 'execute',
          coordination_score: utilityUsed ? 0.7 : 0.4,
          success: false, // Would need round outcome to determine
          details: {
            utility_timing: utilityUsed ? 0.7 : 0.3,
            trade_efficiency: 0.5, // Would need kill data
            positioning_score: 0.6,
          },
        });
      }

      // Check for retake patterns
      if (packets.some((p) => p.match_context.spike_status === 'planted')) {
        const retakers = defenders.filter((p) => p.player.is_moving);
        if (retakers.length >= 2) {
          events.push({
            timestamp: window[0].timestamp,
            window_duration: windowSize,
            players_involved: retakers.map((p) => p.player.id),
            event_type: 'retake',
            coordination_score: 0.6,
            success: false,
            details: {
              utility_timing: 0.5,
              trade_efficiency: 0.5,
              positioning_score: 0.6,
            },
          });
        }
      }
    }

    return events;
  }

  /**
   * Create time windows for analysis
   */
  private createTimeWindows(
    packets: GridDataPacket[],
    windowSize: number
  ): GridDataPacket[][] {
    if (!Array.isArray(packets) || packets.length === 0) {
      return [];
    }

    if (typeof windowSize !== 'number' || windowSize <= 0) {
      throw new GridIngestionError(`Invalid windowSize: ${windowSize}`);
    }

    const windows: GridDataPacket[][] = [];
    const sortedPackets = [...packets].sort((a, b) => {
      if (typeof a.timestamp !== 'number' || typeof b.timestamp !== 'number') {
        throw new GridIngestionError('Packet timestamp must be a number');
      }
      return a.timestamp - b.timestamp;
    });
    
    const startTime = sortedPackets[0].timestamp;
    
    if (typeof startTime !== 'number' || isNaN(startTime)) {
      throw new GridIngestionError(`Invalid start timestamp: ${startTime}`);
    }

    let currentWindow: GridDataPacket[] = [];
    let windowStart = startTime;

    for (const packet of sortedPackets) {
      if (typeof packet.timestamp !== 'number' || isNaN(packet.timestamp)) {
        throw new GridIngestionError(`Invalid packet timestamp: ${packet.timestamp}`);
      }

      if (packet.timestamp - windowStart > windowSize * 1000) {
        if (currentWindow.length > 0) {
          windows.push(currentWindow);
        }
        currentWindow = [packet];
        windowStart = packet.timestamp;
      } else {
        currentWindow.push(packet);
      }
    }

    if (currentWindow.length > 0) {
      windows.push(currentWindow);
    }

    return windows;
  }

  /**
   * Group packets by round
   */
  private groupByRound(packets: GridDataPacket[]): GridDataPacket[][] {
    if (!Array.isArray(packets) || packets.length === 0) {
      return [];
    }

    // Simplified: assume packets are already grouped or use match context
    // In real implementation, would use round_number from match context
    const rounds: GridDataPacket[][] = [];
    let currentRound: GridDataPacket[] = [];

    for (const packet of packets) {
      if (!packet || !packet.match_context) {
        throw new GridIngestionError('Packet missing match_context');
      }

      // If this is a new round (pre_round phase), start new round
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

  /**
   * Generate round summary
   */
  private generateRoundSummary(packets: GridDataPacket[]): RoundSummary {
    if (!Array.isArray(packets) || packets.length === 0) {
      throw new GridIngestionError('Cannot generate summary from empty packet array');
    }

    const firstPacket = packets[0];
    const lastPacket = packets[packets.length - 1];
    
    if (!firstPacket || !lastPacket) {
      throw new GridIngestionError('Invalid packets array');
    }

    if (!firstPacket.match_context || !lastPacket.match_context) {
      throw new GridIngestionError('Packets missing match_context');
    }

    if (typeof firstPacket.timestamp !== 'number' || typeof lastPacket.timestamp !== 'number') {
      throw new GridIngestionError('Packets missing valid timestamps');
    }

    const context = firstPacket.match_context;

    // Extract key events
    const keyEvents: KeyEvent[] = [];
    for (const packet of packets) {
      // Check for ability usage
      const abilities = packet.inventory.abilities;
      for (const ability of Object.values(abilities)) {
        if (ability && ability.charges < 1) {
          keyEvents.push({
            timestamp: packet.timestamp,
            type: 'ability',
            player_id: packet.player.id,
            impact: 'medium',
            description: `${packet.player.agent} used ${ability.name}`,
          });
        }
      }
    }

    // Determine economy state
    let totalCredits = 0;
    let validPackets = 0;
    
    for (const packet of packets) {
      if (packet && packet.inventory && typeof packet.inventory.credits === 'number') {
        if (packet.inventory.credits < 0) {
          console.warn(`Invalid credits value: ${packet.inventory.credits}, skipping`);
          continue;
        }
        totalCredits += packet.inventory.credits;
        validPackets++;
      }
    }

    if (validPackets === 0) {
      throw new GridIngestionError('No valid packets with credits found');
    }

    const avgCredits = totalCredits / validPackets;
    
    if (isNaN(avgCredits) || !isFinite(avgCredits)) {
      throw new GridIngestionError(`Invalid average credits: ${avgCredits}`);
    }

    let economyState: 'full_buy' | 'force' | 'eco' | 'semi';
    if (avgCredits >= 4000) economyState = 'full_buy';
    else if (avgCredits >= 2000) economyState = 'semi';
    else if (avgCredits >= 1000) economyState = 'force';
    else economyState = 'eco';

    const duration = (lastPacket.timestamp - firstPacket.timestamp) / 1000;
    
    if (duration < 0) {
      throw new GridIngestionError(
        `Invalid duration: ${duration} (lastPacket timestamp ${lastPacket.timestamp} < firstPacket timestamp ${firstPacket.timestamp})`
      );
    }

    return {
      round_number: 1, // Would come from match context
      winner: 'Attacker', // Would come from match outcome
      win_type: 'elimination',
      economy_state: economyState,
      duration,
      key_events: keyEvents,
    };
  }
}

export const gridIngestion = new GridIngestionService();

