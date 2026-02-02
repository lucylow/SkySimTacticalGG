// Data Fetcher Agent - Fetches player/match data from GRID API and historical database
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';
import { backendApi } from '@/services/backendApi';

export interface FetchedData {
  player?: {
    id: string;
    name?: string;
    stats?: Record<string, unknown>;
  };
  matches?: Array<{
    id: string;
    rounds: unknown[];
    events: unknown[];
    telemetry: unknown[];
  }>;
  telemetry?: unknown[];
  events?: unknown[];
  economy?: unknown[];
  positions?: unknown[];
}

class DataFetcherAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'DataFetcher',
      AgentRole.DATA_FETCHER,
      {
        data_fetching: true,
      },
      config
    );
  }

  async processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: FetchedData;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { player_id, match_ids, data_types } = task.input_data as {
        player_id?: string;
        match_ids?: string[];
        data_types?: string[];
      };

      const fetchedData: FetchedData = {};

      // Fetch player data if player_id provided
      if (player_id) {
        // In a real implementation, this would fetch from GRID API
        // For now, we'll use mock data structure
        fetchedData.player = {
          id: player_id,
        };
      }

      // Fetch match data if match_ids provided
      if (match_ids && match_ids.length > 0) {
        const matches = [];

        for (const matchId of match_ids) {
          try {
            // Fetch match metadata
            const match = await backendApi.getMatch(matchId);

            // Fetch rounds
            const rounds = await backendApi.getRounds(matchId);

            matches.push({
              id: matchId,
              rounds: rounds.map((r) => ({
                round_number: r.round_number,
                winning_team_id: r.winning_team_id,
                round_type: r.round_type,
                duration_seconds: r.duration_seconds,
              })),
              events: [], // Would be populated from GRID API
              telemetry: [], // Would be populated from GRID API
              metadata: match,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.log(`Failed to fetch match ${matchId}: ${errorMessage}`, 'warn');
          }
        }

        fetchedData.matches = matches;
      }

      // Filter data types if specified
      const requestedTypes = data_types || ['telemetry', 'events', 'economy', 'positions'];

      if (requestedTypes.includes('telemetry')) {
        fetchedData.telemetry = fetchedData.matches?.flatMap((m) => m.telemetry || []) || [];
      }

      if (requestedTypes.includes('events')) {
        fetchedData.events = fetchedData.matches?.flatMap((m) => m.events || []) || [];
      }

      const processingTime = this.getProcessingTime();

      return {
        success: true,
        result: fetchedData,
        processing_time_ms: processingTime,
        task_type: 'data_fetching',
        accuracy: 1.0, // Data fetching is deterministic
      };
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'data_fetching',
      };
    }
  }
}

export const dataFetcherAgent = new DataFetcherAgent();
