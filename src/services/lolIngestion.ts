// League of Legends Data Ingestion Service
// Handles fetching and normalizing LoL match data from Riot/GRID-style APIs

import { supabase } from '@/integrations/supabase/client';

export interface LolIngestOptions {
  region: string;
  queueId?: number;
  maxGames?: number;
}

export class LolIngestionService {
  /**
   * Ingest player match history by PUUID
   */
  async ingestPlayerHistoryByPuuid(puuid: string, opts: LolIngestOptions): Promise<void> {
    const { region, maxGames = 10 } = opts;
    
    try {
      // Log start of ingestion
      await this.logAudit('fetch_match_list', puuid, 'ok', `Starting ingestion for ${puuid} in ${region}`);

      // Sample fetching match IDs (in production, call Riot API)
      const matchIds = Array.from({ length: maxGames }, (_, i) => `${region}_${12345678 + i}`);

      for (const matchId of matchIds) {
        await this.ingestMatch(matchId, region);
      }

      await this.logAudit('ingest_complete', puuid, 'ok', `Successfully ingested ${matchIds.length} matches`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.logAudit('ingest_failed', puuid, 'failed', message);
      throw error;
    }
  }

  /**
   * Ingest a single match by ID
   */
  private async ingestMatch(providerMatchId: string, region: string): Promise<void> {
    // 1. Check if match already exists to avoid duplicates
    const { data: existingMatch } = await supabase
      .from('lol_matches' as any)
      .select('id')
      .eq('provider_match_id', providerMatchId)
      .single();

    if (existingMatch) return;

    // 2. Sample match data (in production, fetch from Riot API)
    const matchData = {
      provider_match_id: providerMatchId,
      region,
      patch: '14.2',
      match_ts: new Date().toISOString(),
      raw: { /* full riot json */ }
    };

    // 3. Upsert match
    const { data: match, error: matchError } = await supabase
      .from('lol_matches' as any)
      .upsert(matchData)
      .select()
      .single();

    if (matchError) throw matchError;

    // 4. Ingest participants and their stats
    // This would involve mapping participants from raw data to lol_players and lol_game_participants
    console.log(`Ingested match ${providerMatchId}`);
  }

  /**
   * Log ingestion actions to audit table
   */
  private async logAudit(action: string, resourceId: string, status: string, message: string): Promise<void> {
    await supabase.from('lol_ingest_audit' as any).insert({
      provider_resource_id: resourceId,
      action,
      status,
      message,
      created_at: new Date().toISOString()
    });
  }

  /**
   * Utility for exponential backoff on API calls
   */
  private async fetchWithBackoff(url: string, opts: any = {}, max = 5): Promise<Response> {
    let attempts = 0;
    while (attempts < max) {
      attempts++;
      const res = await fetch(url, opts);
      if (res.ok) return res;
      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After')) || Math.pow(2, attempts) * 1000;
        await new Promise(resolve => setTimeout(resolve, retryAfter + Math.random() * 200));
        continue;
      }
      if (res.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        continue;
      }
      throw new Error(`Fetch failed (${res.status}): ${await res.text()}`);
    }
    throw new Error('Max attempts reached');
  }
}

