// Game State Extractor - Extracts structured game state from GRID data packets
// Used by prediction agents to get accurate game state information

import type { GridDataPacket, MatchContext, PlayerState } from '@/types/grid';
import type { RoundData, MatchMetadata } from '@/types/backend';

export interface ExtractedGameState {
  round_number: number;
  score: [number, number];
  team_economy: number;
  opponent_economy: number;
  player_states: Array<{
    id: string;
    team: 'Attacker' | 'Defender';
    health: number;
    armor: number;
    weapon: string;
    utility: string[];
    position: { x: number; y: number; z: number };
  }>;
  time_remaining: number;
  objective_state: {
    spike_status: 'not_planted' | 'planted' | 'defused' | 'exploded';
    spike_plant_time?: number;
    site_control: 'Attacker' | 'Defender' | 'Contested';
    bomb_site?: 'A' | 'B' | 'C';
  };
  round_phase: 'pre_round' | 'mid_round' | 'post_plant' | 'retake';
}

/**
 * Extract structured game state from GRID data packets
 */
export class GameStateExtractor {
  /**
   * Extract game state from GRID packets at a specific timestamp
   */
  extractGameState(
    packets: GridDataPacket[],
    roundNumber: number,
    roundData: RoundData,
    matchData: MatchMetadata
  ): ExtractedGameState {
    // Get the latest packet for this round (or filter by timestamp if needed)
    const roundPackets = packets.filter(p => {
      // In production, would match by round number from GRID metadata
      return true; // For now, use all packets
    });

    const latestPacket = roundPackets[roundPackets.length - 1] || packets[0];
    const context = latestPacket?.match_context || ({} as MatchContext);

    // Extract player states
    const playerStates = this.extractPlayerStates(roundPackets);

    // Calculate score
    const score = this.calculateScore(roundData, matchData);

    // Extract objective state
    const objectiveState = this.extractObjectiveState(context, roundData);

    // Determine round phase
    const roundPhase = this.determineRoundPhase(context, roundData);

    return {
      round_number: roundNumber,
      score,
      team_economy: roundData.team_a_start_money,
      opponent_economy: roundData.team_b_start_money,
      player_states: playerStates,
      time_remaining: context.round_time_remaining || 100,
      objective_state: objectiveState,
      round_phase: roundPhase,
    };
  }

  /**
   * Extract player states from GRID packets
   */
  private extractPlayerStates(packets: GridDataPacket[]): ExtractedGameState['player_states'] {
    // Group packets by player ID to get latest state for each player
    const playerMap = new Map<string, GridDataPacket>();

    for (const packet of packets) {
      const playerId = packet.player.id;
      const existing = playerMap.get(playerId);
      if (!existing || packet.timestamp > existing.timestamp) {
        playerMap.set(playerId, packet);
      }
    }

    return Array.from(playerMap.values()).map(packet => ({
      id: packet.player.id,
      team: packet.player.team,
      health: packet.player.health,
      armor: packet.player.armor,
      weapon: packet.inventory.primary_weapon || 'unknown',
      utility: Object.values(packet.inventory.abilities)
        .filter(a => a && a.charges > 0)
        .map(a => a!.name),
      position: packet.player.position,
    }));
  }

  /**
   * Extract objective state from match context
   */
  private extractObjectiveState(
    context: MatchContext,
    roundData: RoundData
  ): ExtractedGameState['objective_state'] {
    return {
      spike_status: context.spike_status || 'not_planted',
      spike_plant_time: context.spike_plant_time,
      site_control: context.site_control || 'Contested',
      bomb_site: roundData.bomb_site,
    };
  }

  /**
   * Determine round phase from context
   */
  private determineRoundPhase(
    context: MatchContext,
    roundData: RoundData
  ): ExtractedGameState['round_phase'] {
    if (context.round_phase) {
      return context.round_phase;
    }

    // Infer from spike status
    if (context.spike_status === 'planted') {
      return 'post_plant';
    }

    // Infer from time
    if (context.round_time_remaining && context.round_time_remaining < 10) {
      return 'retake';
    }

    if (context.round_time_remaining && context.round_time_remaining > 90) {
      return 'pre_round';
    }

    return 'mid_round';
  }

  /**
   * Calculate score at a specific round
   */
  private calculateScore(roundData: RoundData, matchData: MatchMetadata): [number, number] {
    // In production, would calculate from all rounds up to this point
    // For now, return placeholder
    return [0, 0];
  }

  /**
   * Extract retake-specific state for VALORANT retake analyzer
   */
  extractRetakeState(
    packets: GridDataPacket[],
    roundData: RoundData
  ): {
    defenders: number;
    attackers: number;
    site: 'A' | 'B' | 'C';
    site_control: number;
    time_remaining: number;
    player_states: Array<{
      health: number;
      armor: number;
      weapon: string;
      utility: string[];
    }>;
  } {
    const gameState = this.extractGameState(packets, roundData.round_number, roundData, {} as MatchMetadata);

    // Count players by team
    const defenders = gameState.player_states.filter(p => p.team === 'Defender').length;
    const attackers = gameState.player_states.filter(p => p.team === 'Attacker').length;

    // Calculate site control (0-1)
    let siteControl = 0.5;
    if (gameState.objective_state.site_control === 'Attacker') {
      siteControl = 0.8;
    } else if (gameState.objective_state.site_control === 'Defender') {
      siteControl = 0.2;
    }

    return {
      defenders,
      attackers,
      site: gameState.objective_state.bomb_site || 'A',
      site_control: siteControl,
      time_remaining: gameState.time_remaining,
      player_states: gameState.player_states
        .filter(p => p.team === 'Defender')
        .map(p => ({
          health: p.health,
          armor: p.armor,
          weapon: p.weapon,
          utility: p.utility,
        })),
    };
  }
}

export const gameStateExtractor = new GameStateExtractor();


