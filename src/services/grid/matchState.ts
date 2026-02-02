// Match State Reconstruction Engine
// Reconstructs match state from canonical events

import type { CanonicalEvent, MatchState, PlayerMatchStats, RoundState } from '@/types/grid';
import { GridValidator, GridStateError } from '@/types/grid';

export class MatchStateEngine {
  private states: Map<string, MatchState> = new Map();

  /**
   * Process an event and update match state
   */
  processEvent(event: CanonicalEvent): MatchState {
    try {
      // Validate event structure
      GridValidator.validateCanonicalEvent(event);
    } catch (error) {
      throw new GridStateError(
        `Invalid canonical event: ${error instanceof Error ? error.message : String(error)}`,
        event.match_id,
        event.event_id
      );
    }

    let state = this.states.get(event.match_id);
    
    if (!state) {
      // Only initialize state for MATCH_START events
      if (event.event_type !== 'MATCH_START') {
        throw new GridStateError(
          `Cannot process ${event.event_type} event before MATCH_START`,
          event.match_id,
          event.event_id
        );
      }
      state = this.initializeState(event.match_id);
    }

    try {
      switch (event.event_type) {
        case 'MATCH_START':
          state = this.handleMatchStart(state, event);
          break;
        case 'MAP_START':
          state = this.handleMapStart(state, event);
          break;
        case 'ROUND_START':
          state = this.handleRoundStart(state, event);
          break;
        case 'KILL':
          state = this.handleKill(state, event);
          break;
        case 'ASSIST':
          state = this.handleAssist(state, event);
          break;
        case 'ROUND_END':
          state = this.handleRoundEnd(state, event);
          break;
        case 'MAP_END':
          state = this.handleMapEnd(state, event);
          break;
        case 'OBJECTIVE':
        case 'ECONOMY_UPDATE':
        case 'MATCH_END':
          // These events don't modify state directly, but we still process them
          break;
        default:
          // TypeScript should catch this, but handle at runtime too
          throw new GridStateError(
            `Unhandled event type: ${(event as CanonicalEvent).event_type}`,
            event.match_id,
            event.event_id
          );
      }
    } catch (error) {
      if (error instanceof GridStateError) {
        throw error;
      }
      throw new GridStateError(
        `Failed to process event: ${error instanceof Error ? error.message : String(error)}`,
        event.match_id,
        event.event_id
      );
    }

    this.states.set(event.match_id, state);
    return state;
  }

  /**
   * Get current state for a match
   */
  getState(matchId: string): MatchState | undefined {
    return this.states.get(matchId);
  }

  /**
   * Rebuild state from all events (for replay)
   */
  rebuildFromEvents(events: CanonicalEvent[]): MatchState | undefined {
    if (events.length === 0) return undefined;

    // Validate all events have the same match_id
    const matchId = events[0].match_id;
    const mismatchedEvents = events.filter(e => e.match_id !== matchId);
    if (mismatchedEvents.length > 0) {
      throw new GridStateError(
        `Cannot rebuild state: events contain multiple match_ids. Expected ${matchId}, found ${mismatchedEvents[0].match_id}`,
        matchId
      );
    }

    const sortedEvents = [...events].sort(
      (a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (isNaN(timeA) || isNaN(timeB)) {
          throw new GridStateError(
            `Invalid timestamp in event: ${isNaN(timeA) ? a.timestamp : b.timestamp}`,
            matchId
          );
        }
        return timeA - timeB;
      }
    );

    let state: MatchState | undefined;
    for (const event of sortedEvents) {
      try {
        state = this.processEvent(event);
      } catch (error) {
        throw new GridStateError(
          `Failed to rebuild state at event ${event.event_id}: ${error instanceof Error ? error.message : String(error)}`,
          matchId,
          event.event_id
        );
      }
    }

    return state;
  }

  private initializeState(matchId: string): MatchState {
    return {
      match_id: matchId,
      score: {},
      current_round: 0,
      players: {},
      team_economy: {},
      round_history: [],
    };
  }

  private handleMatchStart(state: MatchState, event: CanonicalEvent): MatchState {
    const payload = event.payload as Record<string, unknown>;
    
    if (!Array.isArray(payload.teams) || payload.teams.length === 0) {
      throw new GridStateError(
        'MATCH_START event requires teams array with at least one team',
        event.match_id,
        event.event_id
      );
    }

    // Validate teams are strings
    const invalidTeams = (payload.teams as unknown[]).filter(t => typeof t !== 'string');
    if (invalidTeams.length > 0) {
      throw new GridStateError(
        'MATCH_START event teams must be an array of strings',
        event.match_id,
        event.event_id
      );
    }

    const newScore: Record<string, number> = {};
    (payload.teams as string[]).forEach((team) => {
      if (!team) {
        throw new GridStateError(
          'MATCH_START event teams cannot contain empty strings',
          event.match_id,
          event.event_id
        );
      }
      newScore[team] = 0;
    });
    return { ...state, score: newScore };
  }

  private handleMapStart(state: MatchState, event: CanonicalEvent): MatchState {
    return { ...state, current_map: event.map };
  }

  private handleRoundStart(state: MatchState, event: CanonicalEvent): MatchState {
    const payload = event.payload as Record<string, unknown>;
    
    if (!payload.economy || typeof payload.economy !== 'object') {
      throw new GridStateError(
        'ROUND_START event requires economy object',
        event.match_id,
        event.event_id
      );
    }

    const economy = payload.economy as Record<string, unknown>;
    const validatedEconomy: Record<string, number> = {};
    
    for (const [team, value] of Object.entries(economy)) {
      if (typeof value !== 'number' || value < 0) {
        throw new GridStateError(
          `ROUND_START event economy.${team} must be a non-negative number`,
          event.match_id,
          event.event_id
        );
      }
      validatedEconomy[team] = value;
    }

    const roundNumber = event.round;
    if (roundNumber !== undefined && (typeof roundNumber !== 'number' || roundNumber < 1)) {
      throw new GridStateError(
        'ROUND_START event round must be a positive number if provided',
        event.match_id,
        event.event_id
      );
    }

    const roundState: RoundState = {
      round_number: roundNumber || state.current_round + 1,
      economy_start: { ...validatedEconomy },
    };

    return {
      ...state,
      current_round: roundNumber || state.current_round + 1,
      team_economy: { ...validatedEconomy },
      round_history: [...state.round_history, roundState],
    };
  }

  private handleKill(state: MatchState, event: CanonicalEvent): MatchState {
    if (!event.actor && !event.target) {
      throw new GridStateError(
        'KILL event requires at least actor or target',
        event.match_id,
        event.event_id
      );
    }

    const newPlayers = { ...state.players };
    
    // Update killer stats
    if (event.actor) {
      if (!event.actor.startsWith('player:')) {
        throw new GridStateError(
          `KILL event actor must start with 'player:': ${event.actor}`,
          event.match_id,
          event.event_id
        );
      }
      const killerId = event.actor.replace('player:', '');
      if (!killerId) {
        throw new GridStateError(
          'KILL event actor cannot be empty after removing prefix',
          event.match_id,
          event.event_id
        );
      }
      const killer = newPlayers[killerId] || this.initializePlayerStats(killerId);
      newPlayers[killerId] = {
        ...killer,
        kills: killer.kills + 1,
      };
    }

    // Update victim stats
    if (event.target) {
      if (!event.target.startsWith('player:')) {
        throw new GridStateError(
          `KILL event target must start with 'player:': ${event.target}`,
          event.match_id,
          event.event_id
        );
      }
      const victimId = event.target.replace('player:', '');
      if (!victimId) {
        throw new GridStateError(
          'KILL event target cannot be empty after removing prefix',
          event.match_id,
          event.event_id
        );
      }
      const victim = newPlayers[victimId] || this.initializePlayerStats(victimId);
      newPlayers[victimId] = {
        ...victim,
        deaths: victim.deaths + 1,
      };
    }

    return { ...state, players: newPlayers };
  }

  private handleAssist(state: MatchState, event: CanonicalEvent): MatchState {
    if (!event.actor) {
      throw new GridStateError(
        'ASSIST event requires actor',
        event.match_id,
        event.event_id
      );
    }

    if (!event.actor.startsWith('player:')) {
      throw new GridStateError(
        `ASSIST event actor must start with 'player:': ${event.actor}`,
        event.match_id,
        event.event_id
      );
    }

    const newPlayers = { ...state.players };
    const playerId = event.actor.replace('player:', '');
    
    if (!playerId) {
      throw new GridStateError(
        'ASSIST event actor cannot be empty after removing prefix',
        event.match_id,
        event.event_id
      );
    }

    const player = newPlayers[playerId] || this.initializePlayerStats(playerId);
    newPlayers[playerId] = {
      ...player,
      assists: player.assists + 1,
    };

    return { ...state, players: newPlayers };
  }

  private handleRoundEnd(state: MatchState, event: CanonicalEvent): MatchState {
    const payload = event.payload as Record<string, unknown>;
    
    if (typeof payload.winner !== 'string' || !payload.winner) {
      throw new GridStateError(
        'ROUND_END event requires winner as a non-empty string',
        event.match_id,
        event.event_id
      );
    }

    // Validate winner exists in score
    if (!state.score[payload.winner] && Object.keys(state.score).length > 0) {
      // Warning: winner not in known teams, but we'll still add it
      console.warn(
        `ROUND_END event winner '${payload.winner}' not found in match score. Known teams: ${Object.keys(state.score).join(', ')}`
      );
    }

    const newScore = { ...state.score };
    newScore[payload.winner] = (newScore[payload.winner] || 0) + 1;

    // Update round history
    const roundHistory = [...state.round_history];
    const lastRound = roundHistory[roundHistory.length - 1];
    if (lastRound) {
      lastRound.winner = payload.winner;
      if (typeof payload.win_condition === 'string') {
        lastRound.win_condition = payload.win_condition;
      }
    } else {
      throw new GridStateError(
        'ROUND_END event cannot be processed: no round history found. ROUND_START must occur before ROUND_END',
        event.match_id,
        event.event_id
      );
    }

    return {
      ...state,
      score: newScore,
      round_history: roundHistory,
    };
  }

  private handleMapEnd(state: MatchState, event: CanonicalEvent): MatchState {
    const payload = event.payload as Record<string, unknown>;
    
    if (!payload.score || typeof payload.score !== 'object') {
      throw new GridStateError(
        'MAP_END event requires score as an object',
        event.match_id,
        event.event_id
      );
    }

    const score = payload.score as Record<string, unknown>;
    const validatedScore: Record<string, number> = {};
    
    for (const [team, value] of Object.entries(score)) {
      if (typeof value !== 'number' || value < 0) {
        throw new GridStateError(
          `MAP_END event score.${team} must be a non-negative number`,
          event.match_id,
          event.event_id
        );
      }
      validatedScore[team] = value;
    }

    return {
      ...state,
      score: validatedScore,
    };
  }

  private initializePlayerStats(playerId: string): PlayerMatchStats {
    return {
      player_id: playerId,
      kills: 0,
      deaths: 0,
      assists: 0,
      money: 0,
      adr: 0,
    };
  }
}

export const matchStateEngine = new MatchStateEngine();

