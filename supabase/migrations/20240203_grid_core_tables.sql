
-- 20240203_grid_core_tables.sql
-- Core tables for GRID data integration if they don't exist.

CREATE TABLE IF NOT EXISTS grid_matches (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    provider_match_id text NOT NULL,
    map_name text,
    match_ts timestamptz,
    duration_seconds int,
    raw jsonb,
    meta jsonb,
    inserted_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(provider, provider_match_id)
);

CREATE TABLE IF NOT EXISTS grid_players (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    provider_player_id text NOT NULL,
    summoner_name text,
    agent_champion text,
    role text,
    meta jsonb,
    first_seen timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now(),
    UNIQUE(provider, provider_player_id)
);

CREATE TABLE IF NOT EXISTS grid_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES grid_matches(id),
    player_id uuid REFERENCES grid_players(id),
    provider text NOT NULL,
    provider_event_id text,
    event_type text,
    timestamp bigint,
    payload jsonb,
    inserted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grid_micro_signals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid REFERENCES grid_matches(id),
    player_id uuid REFERENCES grid_players(id),
    provider text NOT NULL,
    signals jsonb,
    computed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grid_ingest_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    provider text NOT NULL,
    provider_resource_id text,
    action text,
    status text,
    message text,
    raw jsonb,
    created_at timestamptz DEFAULT now()
);
