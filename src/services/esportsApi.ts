// Multi-Game Esports API Service
// Extends base API functionality with LoL and Valorant specific features

import { api } from './api';
import { supabase } from '@/integrations/supabase/client';
import type { EsportsPlayer } from '@/types/esports';

export class EsportsApiService {
  /**
   * Fetch all players across both games
   */
  async fetchAllEsportsPlayers(): Promise<EsportsPlayer[]> {
    const [lolPlayers, valPlayers] = await Promise.all([
      api.fetchLoLPlayers(),
      api.fetchValorantPlayers()
    ]);
    return [...lolPlayers, ...valPlayers];
  }

  /**
   * Ingest LoL data via Supabase Edge Function or Worker logic
   */
  async ingestLoLMatch(matchId: string): Promise<{ success: boolean; message: string }> {
    try {
      // In production, this would call a Supabase Edge Function
      // const { data, error } = await supabase.functions.invoke('lol-ingest', {
      //   body: { matchId }
      // });
      
      console.log(`Ingesting LoL match: ${matchId}`);
      return { success: true, message: 'Match ingestion started' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get opponent profile for LoL scouting
   */
  async getLoLOpponentProfile(puuid: string): Promise<any> {
    const { data, error } = await supabase
      .from('lol_opponent_profiles' as any)
      .select('*')
      .eq('target_puuid', puuid)
      .single();
      
    if (error) throw error;
    return data;
  }
}

export const esportsApi = new EsportsApiService();
