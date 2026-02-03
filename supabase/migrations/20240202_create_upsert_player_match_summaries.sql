-- 01_create_rpc_upsert_player_match_summaries.sql
CREATE OR REPLACE FUNCTION upsert_player_match_summaries_for_match(_match_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    -- Run the upsert SQL from file with parameter replaced via plpgsql
    INSERT INTO player_match_summaries (
        match_id, player_id, provider, provider_match_id, provider_player_id, summoner_name,
        agent_champion, player_role, kills, deaths, assists, cs, ward_count, damage_dealt,
        damage_taken, gold_earned, micro_signals, cs_per_min, avg_reaction_ms, headshot_rate, 
        damage_per_min, computed_at
    )
    WITH players_in_match AS (
        SELECT p.id AS player_id,
               p.provider,
               p.provider_player_id,
               p.summoner_name,
               p.agent_champion,
               p.role as player_role
        FROM grid_players p
        JOIN grid_micro_signals ms ON ms.player_id = p.id
        WHERE ms.match_id = _match_id
        GROUP BY p.id, p.provider, p.provider_player_id, p.summoner_name, p.agent_champion, p.role
    ),
    events_agg AS (
        SELECT
            e.player_id,
            SUM(CASE WHEN e.event_type='kill' THEN 1 ELSE 0 END) AS kills,
            SUM(CASE WHEN e.event_type='death' THEN 1 ELSE 0 END) AS deaths,
            SUM(CASE WHEN e.event_type='assist' THEN 1 ELSE 0 END) AS assists,
            SUM(CASE WHEN e.event_type='cs' THEN (COALESCE((e.payload->>'amount')::int,0)) ELSE 0 END) AS cs,
            SUM(CASE WHEN e.event_type='ward_placed' THEN 1 ELSE 0 END) AS ward_count,
            SUM(CASE WHEN e.event_type='damage' THEN (COALESCE((e.payload->>'amount')::int,0)) ELSE 0 END) AS damage_dealt,
            SUM(CASE WHEN e.event_type='damage_taken' THEN (COALESCE((e.payload->>'amount')::int,0)) ELSE 0 END) AS damage_taken,
            SUM(CASE WHEN e.event_type='gold' THEN (COALESCE((e.payload->>'amount')::int,0)) ELSE 0 END) AS gold_earned
        FROM grid_events e
        WHERE e.match_id = _match_id
        GROUP BY e.player_id
    ),
    micro_signals AS (
        SELECT ms.player_id,
               ms.signals
        FROM grid_micro_signals ms
        WHERE ms.match_id = _match_id
    )
    SELECT
        _match_id AS match_id,
        p.player_id,
        p.provider,
        (SELECT provider_match_id FROM grid_matches WHERE id = _match_id) AS provider_match_id,
        p.provider_player_id,
        p.summoner_name,
        p.agent_champion,
        p.player_role,
        COALESCE(ea.kills,0) AS kills,
        COALESCE(ea.deaths,0) AS deaths,
        COALESCE(ea.assists,0) AS assists,
        COALESCE(ea.cs,0) AS cs,
        COALESCE(ea.ward_count,0) AS ward_count,
        COALESCE(ea.damage_dealt,0) AS damage_dealt,
        COALESCE(ea.damage_taken,0) AS damage_taken,
        COALESCE(ea.gold_earned,0) AS gold_earned,
        COALESCE(ms.signals, '{}'::jsonb) AS micro_signals,
        CASE WHEN COALESCE((SELECT duration_seconds FROM grid_matches WHERE id = _match_id), 0) > 0
             THEN ROUND( (COALESCE(ea.cs,0) :: numeric) / ((SELECT duration_seconds FROM grid_matches WHERE id = _match_id)::numeric / 60.0), 2)
             ELSE 0 END AS cs_per_min,
        (ms.signals->>'avg_reaction_ms')::int AS avg_reaction_ms,
        (ms.signals->>'headshot_rate')::numeric AS headshot_rate,
        CASE WHEN COALESCE((SELECT duration_seconds FROM grid_matches WHERE id = _match_id), 0) > 0
             THEN ROUND( (COALESCE(ea.damage_dealt,0)::numeric) / ((SELECT duration_seconds FROM grid_matches WHERE id = _match_id)::numeric / 60.0), 1)
             ELSE 0 END AS damage_per_min,
        now() AS computed_at
    FROM players_in_match p
    LEFT JOIN events_agg ea ON ea.player_id = p.player_id
    LEFT JOIN micro_signals ms ON ms.player_id = p.player_id
    ON CONFLICT (match_id, player_id) DO UPDATE
    SET
        provider = EXCLUDED.provider,
        provider_match_id = EXCLUDED.provider_match_id,
        provider_player_id = EXCLUDED.provider_player_id,
        summoner_name = EXCLUDED.summoner_name,
        agent_champion = EXCLUDED.agent_champion,
        player_role = EXCLUDED.player_role,
        kills = EXCLUDED.kills,
        deaths = EXCLUDED.deaths,
        assists = EXCLUDED.assists,
        cs = EXCLUDED.cs,
        ward_count = EXCLUDED.ward_count,
        damage_dealt = EXCLUDED.damage_dealt,
        damage_taken = EXCLUDED.damage_taken,
        gold_earned = EXCLUDED.gold_earned,
        micro_signals = EXCLUDED.micro_signals,
        cs_per_min = EXCLUDED.cs_per_min,
        avg_reaction_ms = EXCLUDED.avg_reaction_ms,
        headshot_rate = EXCLUDED.headshot_rate,
        damage_per_min = EXCLUDED.damage_per_min,
        computed_at = now();
END;
$$;
