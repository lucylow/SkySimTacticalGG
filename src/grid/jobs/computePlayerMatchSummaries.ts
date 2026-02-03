import { supabase } from '../../integrations/supabase/client';
import { auditService } from '../../services/grid/auditService';

/**
 * Processes a batch of matches that need summary computation.
 */
async function processBatch() {
  console.log('Starting player match summary computation batch...');

  try {
    // 1. Find matches that need summary computation
    // Use the optimized RPC function instead of client-side filtering
    const { data: matches, error: fetchError } = await supabase.rpc('get_unprocessed_grid_matches', {
      batch_limit: 50,
    });

    if (fetchError) {
      console.error('[FETCH ERROR] Failed to fetch unprocessed matches:', fetchError);
      return;
    }

    if (!matches || matches.length === 0) {
      console.log('No matches found to process.');
      return;
    }

    console.log(`Found ${matches.length} matches to process.`);

    for (const match of matches) {
      const matchId = match.id;
      try {
        console.log(`Processing match ${matchId}...`);
        
        // Call the RPC function
        const { error: rpcError } = await supabase.rpc('upsert_player_match_summaries_for_match', {
          _match_id: matchId,
        });

        if (rpcError) {
          const errorMessage = rpcError.message || JSON.stringify(rpcError);
          console.error(`[RPC ERROR] for match ${matchId}:`, errorMessage);
          throw new Error(errorMessage);
        }

        await auditService.logSummarySuccess(matchId);
        console.log(`Successfully computed summary for match ${matchId}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[PROCESS ERROR] Failed to compute summary for match ${matchId}:`, errorMsg);
        await auditService.logSummaryFailure(matchId, errorMsg);
      }
    }
  } catch (batchErr) {
    console.error('[BATCH ERROR] Unexpected error in processBatch:', batchErr);
  }
}

// Improved execution check
const isMain = () => {
  if (typeof require !== 'undefined' && require.main === module) return true;
  // Fallback for some environments
  if (import.meta && (import.meta as any).url) {
    const scriptPath = (import.meta as any).url;
    return scriptPath.includes('computePlayerMatchSummaries.ts');
  }
  return false;
};

if (isMain()) {
  (async () => {
    try {
      await processBatch();
      console.log('Batch complete');
      process.exit(0);
    } catch (err) {
      console.error('Worker fatal error', err);
      process.exit(1);
    }
  })();
}

export { processBatch };
