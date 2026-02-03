
-- 20240203_fix_player_match_summaries_schema.sql
-- This migration fixes the player_match_summaries table to match the columns 
-- expected by the upsert_player_match_summaries_for_match RPC function.

ALTER TABLE player_match_summaries 
ADD COLUMN IF NOT EXISTS provider_match_id text,
ADD COLUMN IF NOT EXISTS provider_player_id text,
ADD COLUMN IF NOT EXISTS summoner_name text,
ADD COLUMN IF NOT EXISTS agent_champion text,
ADD COLUMN IF NOT EXISTS player_role text,
ADD COLUMN IF NOT EXISTS ward_count int DEFAULT 0,
ADD COLUMN IF NOT EXISTS damage_taken int DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_earned int DEFAULT 0,
ADD COLUMN IF NOT EXISTS cs_per_min numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_reaction_ms int,
ADD COLUMN IF NOT EXISTS headshot_rate numeric(10,4),
ADD COLUMN IF NOT EXISTS damage_per_min numeric(10,1) DEFAULT 0;

-- Optional: If you want to ensure the unique constraint is correct
-- The table already has UNIQUE (match_id, player_id), which is correct.
