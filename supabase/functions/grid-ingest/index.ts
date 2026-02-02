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

    const { action, matchId, matchData } = await req.json()

    // Audit log helper
    const auditLog = async (
      provider: string,
      resourceId: string,
      actionType: string,
      status: 'ok' | 'failed',
      message: string,
      raw?: unknown
    ) => {
      await supabase.from('grid_ingest_audit').insert({
        provider,
        provider_resource_id: resourceId,
        action: actionType,
        status,
        message,
        raw: raw || null,
      })
    }

    if (action === 'ingest_match') {
      // Ingest a match from provided data
      const data = matchData as GridMatch
      if (!data?.matchId) {
        throw new Error('Match ID required')
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

      return new Response(JSON.stringify({ match, signals: signals || [], events: events || [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'health') {
      return new Response(JSON.stringify({ 
        status: 'ok', 
        hasGridKey: !!GRID_API_KEY,
        timestamp: new Date().toISOString() 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
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