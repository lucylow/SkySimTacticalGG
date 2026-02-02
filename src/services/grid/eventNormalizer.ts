// Event Normalizer - Converts raw GRID events to canonical format

import type { RawGridEvent, CanonicalEvent, MatchStartPayload, MapStartPayload, RoundStartPayload, KillPayload, ObjectivePayload, RoundEndPayload } from '@/types/grid';
import { GridValidator, GridNormalizationError } from '@/types/grid';

export class EventNormalizer {
  /**
   * Normalize a raw GRID event to canonical format
   */
  normalize(raw: RawGridEvent): CanonicalEvent {
    try {
      // Validate raw event structure
      GridValidator.validateRawGridEvent(raw);
    } catch (error) {
      if (error instanceof GridNormalizationError) {
        throw error;
      }
      throw new GridNormalizationError(
        `Invalid raw event structure: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        raw
      );
    }

    const payload = raw.payload;
    
    if (!payload || typeof payload !== 'object') {
      throw new GridNormalizationError('Event payload is missing or invalid', undefined, raw);
    }

    const eventType = (payload as Record<string, unknown>).type;
    
    if (typeof eventType !== 'string' || !eventType) {
      throw new GridNormalizationError(
        'Event payload.type is missing or invalid',
        undefined,
        raw
      );
    }

    try {
      switch (eventType) {
        case 'match_start':
          return this.normalizeMatchStart(raw);
        case 'map_start':
          return this.normalizeMapStart(raw);
        case 'round_start':
          return this.normalizeRoundStart(raw);
        case 'player_kill':
          return this.normalizeKill(raw);
        case 'objective':
          return this.normalizeObjective(raw);
        case 'round_end':
          return this.normalizeRoundEnd(raw);
        case 'map_end':
          return this.normalizeMapEnd(raw);
        case 'match_end':
          return this.normalizeMatchEnd(raw);
        default:
          throw new GridNormalizationError(
            `Unknown event type: ${eventType}`,
            eventType,
            raw
          );
      }
    } catch (error) {
      if (error instanceof GridNormalizationError) {
        throw error;
      }
      throw new GridNormalizationError(
        `Failed to normalize event: ${error instanceof Error ? error.message : String(error)}`,
        eventType,
        raw
      );
    }
  }

  private normalizeMatchStart(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (!Array.isArray(payload.teams) || payload.teams.length === 0) {
      throw new GridNormalizationError(
        'match_start event requires teams array with at least one team',
        'match_start',
        raw
      );
    }

    if (typeof payload.best_of !== 'number' || payload.best_of < 1) {
      throw new GridNormalizationError(
        'match_start event requires best_of to be a positive number',
        'match_start',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'MATCH_START',
      game: raw.game,
      match_id: raw.match_id,
      timestamp: raw.received_at,
      payload: {
        best_of: payload.best_of as number,
        teams: payload.teams as string[],
      } as MatchStartPayload,
    };
  }

  private normalizeMapStart(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (typeof payload.map_name !== 'string' || !payload.map_name) {
      throw new GridNormalizationError(
        'map_start event requires map_name as a non-empty string',
        'map_start',
        raw
      );
    }

    if (!payload.starting_sides || typeof payload.starting_sides !== 'object') {
      throw new GridNormalizationError(
        'map_start event requires starting_sides as an object',
        'map_start',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'MAP_START',
      game: raw.game,
      match_id: raw.match_id,
      map: payload.map_name as string,
      timestamp: raw.received_at,
      payload: {
        map_name: payload.map_name as string,
        starting_sides: payload.starting_sides as Record<string, 'CT' | 'T'>,
      } as MapStartPayload,
    };
  }

  private normalizeRoundStart(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (typeof payload.round !== 'number' || payload.round < 1) {
      throw new GridNormalizationError(
        'round_start event requires round to be a positive number',
        'round_start',
        raw
      );
    }

    if (!payload.economy || typeof payload.economy !== 'object') {
      throw new GridNormalizationError(
        'round_start event requires economy as an object',
        'round_start',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'ROUND_START',
      game: raw.game,
      match_id: raw.match_id,
      round: payload.round as number,
      timestamp: raw.received_at,
      payload: {
        economy: payload.economy as Record<string, number>,
      } as RoundStartPayload,
    };
  }

  private normalizeKill(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (typeof payload.killer !== 'string' || !payload.killer) {
      throw new GridNormalizationError(
        'player_kill event requires killer as a non-empty string',
        'player_kill',
        raw
      );
    }

    if (typeof payload.victim !== 'string' || !payload.victim) {
      throw new GridNormalizationError(
        'player_kill event requires victim as a non-empty string',
        'player_kill',
        raw
      );
    }

    if (typeof payload.weapon !== 'string' || !payload.weapon) {
      throw new GridNormalizationError(
        'player_kill event requires weapon as a non-empty string',
        'player_kill',
        raw
      );
    }

    if (typeof payload.headshot !== 'boolean') {
      throw new GridNormalizationError(
        'player_kill event requires headshot as a boolean',
        'player_kill',
        raw
      );
    }

    if (typeof payload.trade !== 'boolean') {
      throw new GridNormalizationError(
        'player_kill event requires trade as a boolean',
        'player_kill',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'KILL',
      game: raw.game,
      match_id: raw.match_id,
      round: typeof payload.round === 'number' ? payload.round : undefined,
      actor: `player:${payload.killer}`,
      target: `player:${payload.victim}`,
      team: typeof payload.team === 'string' ? payload.team : undefined,
      timestamp: raw.received_at,
      payload: {
        weapon: payload.weapon as string,
        headshot: payload.headshot as boolean,
        trade: payload.trade as boolean,
      } as KillPayload,
    };
  }

  private normalizeObjective(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (typeof payload.objective !== 'string' || !payload.objective) {
      throw new GridNormalizationError(
        'objective event requires objective as a non-empty string',
        'objective',
        raw
      );
    }

    const validObjectives = ['BOMB_PLANT', 'BOMB_DEFUSE', 'SITE_CAPTURE'];
    if (!validObjectives.includes(payload.objective as string)) {
      throw new GridNormalizationError(
        `objective event objective must be one of: ${validObjectives.join(', ')}`,
        'objective',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'OBJECTIVE',
      game: raw.game,
      match_id: raw.match_id,
      timestamp: raw.received_at,
      payload: {
        objective: payload.objective as 'BOMB_PLANT' | 'BOMB_DEFUSE' | 'SITE_CAPTURE',
        site: typeof payload.site === 'string' ? payload.site : undefined,
      } as ObjectivePayload,
    };
  }

  private normalizeRoundEnd(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (typeof payload.winner !== 'string' || !payload.winner) {
      throw new GridNormalizationError(
        'round_end event requires winner as a non-empty string',
        'round_end',
        raw
      );
    }

    if (typeof payload.win_condition !== 'string' || !payload.win_condition) {
      throw new GridNormalizationError(
        'round_end event requires win_condition as a non-empty string',
        'round_end',
        raw
      );
    }

    const validWinConditions = ['ELIMINATION', 'DEFUSE', 'TIME', 'PLANT'];
    if (!validWinConditions.includes(payload.win_condition as string)) {
      throw new GridNormalizationError(
        `round_end event win_condition must be one of: ${validWinConditions.join(', ')}`,
        'round_end',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'ROUND_END',
      game: raw.game,
      match_id: raw.match_id,
      round: typeof payload.round === 'number' ? payload.round : undefined,
      timestamp: raw.received_at,
      payload: {
        winner: payload.winner as string,
        win_condition: payload.win_condition as 'ELIMINATION' | 'DEFUSE' | 'TIME' | 'PLANT',
      } as RoundEndPayload,
    };
  }

  private normalizeMapEnd(raw: RawGridEvent): CanonicalEvent {
    const payload = raw.payload as Record<string, unknown>;
    
    if (!payload.score || typeof payload.score !== 'object') {
      throw new GridNormalizationError(
        'map_end event requires score as an object',
        'map_end',
        raw
      );
    }

    return {
      event_id: raw.ingestion_id,
      event_type: 'MAP_END',
      game: raw.game,
      match_id: raw.match_id,
      timestamp: raw.received_at,
      payload: {
        score: payload.score as Record<string, number>,
      },
    };
  }

  private normalizeMatchEnd(raw: RawGridEvent): CanonicalEvent {
    return {
      event_id: raw.ingestion_id,
      event_type: 'MATCH_END',
      game: raw.game,
      match_id: raw.match_id,
      timestamp: raw.received_at,
      payload: raw.payload,
    };
  }
}

export const eventNormalizer = new EventNormalizer();

