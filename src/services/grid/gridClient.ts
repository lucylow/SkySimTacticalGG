// GRID Client - Mock implementation for hackathon/demo
// In production, this would connect to real GRID API

import type { RawGridEvent } from '@/types/grid';

export class GridStreamClient {
  private subscribers: Set<(event: RawGridEvent) => void> = new Set();
  private isStreaming = false;
  private matchId: string | null = null;

  /**
   * Subscribe to a match stream
   */
  async *subscribe(matchId: string): AsyncGenerator<RawGridEvent> {
    this.matchId = matchId;

    // Simulate GRID stream events
    const events = this.generateMockEvents(matchId);

    for (const event of events) {
      await this.delay(1000 + Math.random() * 2000); // 1-3s between events
      yield event;
    }
  }

  /**
   * Generate mock GRID events for demo
   */
  private generateMockEvents(matchId: string): RawGridEvent[] {
    const events: RawGridEvent[] = [];
    const teams = ['teamA', 'teamB'];
    const players = {
      teamA: ['p1', 'p2', 'p3', 'p4', 'p5'],
      teamB: ['p6', 'p7', 'p8', 'p9', 'p10'],
    };

    // Match start
    events.push({
      ingestion_id: this.generateId(),
      grid_event_id: `grid-${this.generateId()}`,
      received_at: new Date().toISOString(),
      match_id: matchId,
      game: 'cs2',
      payload: {
        type: 'match_start',
        best_of: 3,
        teams,
      },
    });

    // Map start
    events.push({
      ingestion_id: this.generateId(),
      grid_event_id: `grid-${this.generateId()}`,
      received_at: new Date().toISOString(),
      match_id: matchId,
      game: 'cs2',
      payload: {
        type: 'map_start',
        map_name: 'de_mirage',
        starting_sides: {
          teamA: 'CT',
          teamB: 'T',
        },
      },
    });

    // Generate rounds
    for (let round = 1; round <= 5; round++) {
      // Round start
      events.push({
        ingestion_id: this.generateId(),
        grid_event_id: `grid-${this.generateId()}`,
        received_at: new Date().toISOString(),
        match_id: matchId,
        game: 'cs2',
        payload: {
          type: 'round_start',
          round,
          economy: {
            teamA: 24000 - round * 2000,
            teamB: 18000 - round * 1500,
          },
        },
      });

      // Generate kills
      const killCount = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < killCount; i++) {
        const team = teams[Math.floor(Math.random() * teams.length)];
        const teamPlayers = players[team as keyof typeof players];
        const killer = teamPlayers[Math.floor(Math.random() * teamPlayers.length)];
        const victimTeam = teams.find((t) => t !== team)!;
        const victim =
          players[victimTeam as keyof typeof players][
            Math.floor(Math.random() * teamPlayers.length)
          ];

        events.push({
          ingestion_id: this.generateId(),
          grid_event_id: `grid-${this.generateId()}`,
          received_at: new Date().toISOString(),
          match_id: matchId,
          game: 'cs2',
          payload: {
            type: 'player_kill',
            round,
            killer,
            victim,
            team,
            weapon: ['AK47', 'M4A4', 'AWP', 'Glock'][Math.floor(Math.random() * 4)],
            headshot: Math.random() > 0.6,
            trade: Math.random() > 0.7,
          },
        });
      }

      // Round end
      const winner = teams[Math.floor(Math.random() * teams.length)];
      events.push({
        ingestion_id: this.generateId(),
        grid_event_id: `grid-${this.generateId()}`,
        received_at: new Date().toISOString(),
        match_id: matchId,
        game: 'cs2',
        payload: {
          type: 'round_end',
          round,
          winner,
          win_condition: ['ELIMINATION', 'DEFUSE', 'TIME'][Math.floor(Math.random() * 3)],
        },
      });
    }

    return events;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const gridClient = new GridStreamClient();
