import { MinimapFrame } from './types';

// Sample DB for the extractor
const db = {
  query: async (query: string, params: any[]): Promise<any[]> => {
    // Sampleed response from GRID valorant_minimap table
    return [
      {
        timestamp: Date.now() - 5000,
        ally_positions: JSON.stringify([[0.5, 0.5], [0.6, 0.6]]),
        enemy_positions: JSON.stringify([[0.1, 0.1]]),
        utilities: JSON.stringify([{ type: 'smoke', position: [0.2, 0.2], status: 'active', startTime: Date.now() - 2000 }]),
        spike_state: 'down'
      }
      // ... more frames would be here
    ];
  }
};

export class ValorantMinimapExtractor {
  async extractFromGridMatch(matchId: string): Promise<MinimapFrame[]> {
    // Extract 10fps minimap data from GRID
    const rawFrames = await db.query(`
      SELECT timestamp, ally_positions, enemy_positions, 
             utilities, spike_state
      FROM grid_valorant_minimap 
      WHERE match_id = $1 
      ORDER BY timestamp
      LIMIT 300  -- Last 30 seconds
    `, [matchId]);
    
    return rawFrames.map(frame => ({
      timestamp: frame.timestamp,
      allyPositions: JSON.parse(frame.ally_positions),
      enemyPositions: JSON.parse(frame.enemy_positions) || [],
      utilities: JSON.parse(frame.utilities),
      spikeState: frame.spike_state as 'down' | 'up' | 'planted'
    }));
  }
}

