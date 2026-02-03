import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GridMatch {
  matchId: string
  provider: string
  mapName?: string
  matchTs?: string
  durationSeconds?: number
  raw?: Record<string, unknown>
  meta?: Record<string, unknown>
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const GRID_API_KEY = Deno.env.get('GRID_API_Key')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { action, matchId, matchData, computeSummary = false } = await req.json()

    // Audit log helper (centralized logic mirrored for Edge Function compatibility)
    const auditLog = async (
      provider: string,
      resourceId: string,
      actionType: string,
      status: 'ok' | 'failed' | 'success' | 'failure',
      message: string,
      raw?: unknown
    ) => {
      try {
        await supabase.from('grid_ingest_audit').insert({
          provider,
          provider_resource_id: resourceId,
          action: actionType,
          status,
          message,
          raw: raw || null,
        })
      } catch (err) {
        console.error(`[AUDIT ERROR] for ${resourceId}:`, err)
      }
    }

    if (action === 'ingest_match') {
      let data = matchData as GridMatch
      
      // If no matchData but matchId and GRID_API_KEY provided, try fetching from GRID
      if (!data && matchId && GRID_API_KEY) {
        try {
          const response = await fetch(`https://api.grid.gg/v1/matches/${matchId}`, {
            headers: { 'x-api-key': GRID_API_KEY }
          })
          if (response.ok) {
            const gridData = await response.json()
            data = {
              matchId: gridData.id,
              provider: 'grid',
              mapName: gridData.map?.name,
              matchTs: gridData.startTime,
              durationSeconds: gridData.duration,
              raw: gridData
            }
          } else {
            throw new Error(`GRID API returned ${response.status}: ${await response.text()}`)
          }
        } catch (e) {
          await auditLog('grid', matchId, 'fetch_match', 'failed', e.message)
          throw e
        }
      }

      if (!data?.matchId) {
        throw new Error('Match ID or valid GRID data required')
      }

      const { data: matchRow, error: matchErr } = await supabase
        .from('grid_matches')
        .upsert({
          provider: data.provider || 'grid',
          provider_match_id: data.matchId,
          map_name: data.mapName || 'unknown',
          match_ts: data.matchTs || new Date().toISOString(),
          duration_seconds: data.durationSeconds || null,
          raw: data.raw || null,
          meta: data.meta || null,
        }, { onConflict: 'provider,provider_match_id' })
        .select()
        .single()

      if (matchErr) {
        await auditLog(data.provider || 'grid', data.matchId, 'upsert_match', 'failed', matchErr.message)
        throw matchErr
      }

      await auditLog(data.provider || 'grid', data.matchId, 'upsert_match', 'ok', `Match saved: ${matchRow?.id}`)

      if (computeSummary && matchRow?.id) {
        const { error: rpcError } = await supabase.rpc('upsert_player_match_summaries_for_match', {
          _match_id: matchRow.id
        })
        
        if (rpcError) {
          await auditLog(data.provider || 'grid', matchRow.id, 'summary_compute', 'failure', rpcError.message)
        } else {
          await auditLog(data.provider || 'grid', matchRow.id, 'summary_compute', 'success', 'Summary computed automatically')
        }
      }

      return new Response(JSON.stringify({ success: true, match: matchRow }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list_matches') {
      const { data: matches, error } = await supabase
        .from('grid_matches')
        .select('id, provider, provider_match_id, map_name, match_ts, meta')
        .order('match_ts', { ascending: false })
        .limit(50)

      if (error) throw error

      return new Response(JSON.stringify({ matches }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_match') {
      if (!matchId) throw new Error('matchId required')

      const { data: match, error: matchErr } = await supabase
        .from('grid_matches')
        .select('*')
        .eq('id', matchId)
        .single()

      if (matchErr) throw matchErr

      const { data: signals } = await supabase
        .from('grid_micro_signals')
        .select('player_id, signals')
        .eq('match_id', matchId)

      const { data: events } = await supabase
        .from('grid_events')
        .select('*')
        .eq('match_id', matchId)
        .limit(100)

      const { data: summaries } = await supabase
        .from('player_match_summaries')
        .select('*')
        .eq('match_id', matchId)

      return new Response(JSON.stringify({ 
        match, 
        signals: signals || [], 
        events: events || [],
        summaries: summaries || []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'compute_summary') {
      if (!matchId) throw new Error('matchId required')

      const { error: rpcError } = await supabase.rpc('upsert_player_match_summaries_for_match', {
        _match_id: matchId
      })

      if (rpcError) {
        await auditLog('grid', matchId, 'summary_compute', 'failure', rpcError.message)
        throw rpcError
      }

      await auditLog('grid', matchId, 'summary_compute', 'success', 'Summary computed manually via API')

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'health') {
      try {
        const { data, error } = await supabase.from('grid_matches').select('id').limit(1);
        const dbStatus = error ? `error: ${error.message}` : 'connected';
        
        return new Response(JSON.stringify({ 
          status: 'ok', 
          database: dbStatus,
          hasGridKey: !!GRID_API_KEY,
          timestamp: new Date().toISOString() 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch (err) {
        return new Response(JSON.stringify({ 
          status: 'degraded', 
          error: String(err),
          timestamp: new Date().toISOString() 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})