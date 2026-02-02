// Open Source Esports Data Client
// Integrates multiple open source esports data APIs on top of GRID

import type { RawGridEvent } from '@/types/grid';

export enum EsportsDataSource {
  RIOT_GAMES = 'riot_games',
  OPENDOTA = 'opendota',
  LIQUIPEDIA = 'liquipedia',
  PANDASCORE = 'pandascore',
}

// Riot Games API response types
interface RiotFeaturedGamesResponse {
  gameList?: Array<Record<string, unknown>>;
}

type RiotMatchResponse = Record<string, unknown>;

// OpenDota API response types
interface OpenDotaMatch extends Record<string, unknown> {
  match_id?: number | string;
  // OpenDota match structure
}

export interface OpenSourceMatch {
  source: EsportsDataSource;
  game: string;
  match_id: string;
  raw_data: Record<string, unknown>;
  timestamp: string;
}

export class RiotGamesClient {
  private apiKey: string | null = null;
  private baseUrls = {
    americas: 'https://americas.api.riotgames.com',
    europe: 'https://europe.api.riotgames.com',
    asia: 'https://asia.api.riotgames.com',
  };
  private regionalUrls = {
    na: 'https://na1.api.riotgames.com',
    euw: 'https://euw1.api.riotgames.com',
    kr: 'https://kr.api.riotgames.com',
  };

  constructor(apiKey?: string) {
    this.apiKey = apiKey || null;
  }

  async getLiveMatches(region: string = 'na'): Promise<Array<Record<string, unknown>>> {
    if (!this.apiKey) {
      console.warn('Riot API key not configured');
      return [];
    }

    const url = `${this.regionalUrls[region as keyof typeof this.regionalUrls] || this.regionalUrls.na}/lol/spectator/v4/featured-games`;

    try {
      const response = await fetch(url, {
        headers: { 'X-Riot-Token': this.apiKey },
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('Riot API rate limit hit');
        }
        return [];
      }

      const data = (await response.json()) as RiotFeaturedGamesResponse;
      return data.gameList || [];
    } catch (error) {
      console.error('Error fetching Riot live matches:', error);
      return [];
    }
  }

  async getMatchDetails(
    matchId: string,
    region: string = 'americas'
  ): Promise<RiotMatchResponse | null> {
    if (!this.apiKey) {
      return null;
    }

    const url = `${this.baseUrls[region as keyof typeof this.baseUrls] || this.baseUrls.americas}/lol/match/v5/matches/${matchId}`;

    try {
      const response = await fetch(url, {
        headers: { 'X-Riot-Token': this.apiKey },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        return null;
      }

      return (await response.json()) as RiotMatchResponse;
    } catch (error) {
      console.error('Error fetching Riot match details:', error);
      return null;
    }
  }
}

export class OpenDotaClient {
  private baseUrl = 'https://api.opendota.com/api';

  async getLiveMatches(): Promise<OpenDotaMatch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/live`);
      if (!response.ok) {
        return [];
      }
      return (await response.json()) as OpenDotaMatch[];
    } catch (error) {
      console.error('Error fetching OpenDota live matches:', error);
      return [];
    }
  }

  async getMatchDetails(matchId: number): Promise<OpenDotaMatch | null> {
    try {
      const response = await fetch(`${this.baseUrl}/matches/${matchId}`);
      if (!response.ok) {
        return null;
      }
      return (await response.json()) as OpenDotaMatch;
    } catch (error) {
      console.error('Error fetching OpenDota match details:', error);
      return null;
    }
  }

  async getProMatches(limit: number = 100): Promise<OpenDotaMatch[]> {
    try {
      const response = await fetch(`${this.baseUrl}/proMatches`);
      if (!response.ok) {
        return [];
      }
      const matches = (await response.json()) as OpenDotaMatch[];
      return matches.slice(0, limit);
    } catch (error) {
      console.error('Error fetching OpenDota pro matches:', error);
      return [];
    }
  }
}

export class OpenSourceEsportsClient {
  private riot: RiotGamesClient;
  private opendota: OpenDotaClient;
  private subscribers: Set<(match: OpenSourceMatch) => void> = new Set();
  private isPolling = false;
  private pollInterval: number = 60000; // 60 seconds

  constructor(riotApiKey?: string) {
    this.riot = new RiotGamesClient(riotApiKey);
    this.opendota = new OpenDotaClient();
  }

  /**
   * Subscribe to open source esports matches
   */
  subscribe(callback: (match: OpenSourceMatch) => void): () => void {
    this.subscribers.add(callback);

    if (!this.isPolling) {
      this.startPolling();
    }

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
      if (this.subscribers.size === 0) {
        this.stopPolling();
      }
    };
  }

  /**
   * Start polling for live matches from all sources
   */
  private startPolling(): void {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    void this.poll();
  }

  /**
   * Stop polling
   */
  private stopPolling() {
    this.isPolling = false;
  }

  /**
   * Poll all sources and notify subscribers
   */
  private async poll() {
    if (!this.isPolling) {
      return;
    }

    try {
      const matches = await this.fetchAllLiveMatches();

      for (const match of matches) {
        // Notify all subscribers
        this.subscribers.forEach((callback) => {
          try {
            callback(match);
          } catch (error) {
            console.error('Error in subscriber callback:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error polling open source matches:', error);
    }

    // Schedule next poll
    if (this.isPolling) {
      setTimeout(() => {
        void this.poll();
      }, this.pollInterval);
    }
  }

  /**
   * Fetch live matches from all available sources
   */
  async fetchAllLiveMatches(): Promise<OpenSourceMatch[]> {
    const allMatches: OpenSourceMatch[] = [];

    // Fetch from multiple sources concurrently
    const [riotMatches, opendotaMatches] = await Promise.all([
      this.fetchRiotMatches(),
      this.fetchOpenDotaMatches(),
    ]);

    allMatches.push(...riotMatches, ...opendotaMatches);

    return allMatches;
  }

  /**
   * Fetch Riot Games matches
   */
  private async fetchRiotMatches(): Promise<OpenSourceMatch[]> {
    const matches: OpenSourceMatch[] = [];

    try {
      const live = await this.riot.getLiveMatches();
      for (const match of live) {
        const gameId = match.gameId;
        const matchId =
          typeof gameId === 'string' || typeof gameId === 'number' ? String(gameId) : '';
        matches.push({
          source: EsportsDataSource.RIOT_GAMES,
          game: 'league_of_legends',
          match_id: matchId,
          raw_data: match,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching Riot matches:', error);
    }

    return matches;
  }

  /**
   * Fetch OpenDota matches
   */
  private async fetchOpenDotaMatches(): Promise<OpenSourceMatch[]> {
    const matches: OpenSourceMatch[] = [];

    try {
      const live = await this.opendota.getLiveMatches();
      for (const match of live) {
        matches.push({
          source: EsportsDataSource.OPENDOTA,
          game: 'dota2',
          match_id: String(match.match_id || ''),
          raw_data: match,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Error fetching OpenDota matches:', error);
    }

    return matches;
  }

  /**
   * Convert open source match to GRID-like event format
   */
  convertToGridEvent(match: OpenSourceMatch): RawGridEvent {
    return {
      ingestion_id: `${match.source}-${match.match_id}-${Date.now()}`,
      grid_event_id: `${match.source}-${match.match_id}`,
      received_at: match.timestamp,
      match_id: match.match_id,
      game: match.game,
      payload: {
        ...match.raw_data,
        source: match.source,
      },
    };
  }
}

// Export singleton instance
export const opensourceEsportsClient = new OpenSourceEsportsClient();
