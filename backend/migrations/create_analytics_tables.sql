-- Migration: Create analytics tables for Macro-Strategy Correlation
-- Run this migration to create the required tables for the analytics system
--
-- Note: This SQL uses Postgres-specific functions (gen_random_uuid(), JSONB).
-- For SQLite, use SQLAlchemy's init_db() which handles UUID generation in Python.
-- The models_analytics.py uses Python's uuid.uuid4() for cross-database compatibility.

-- Rounds table (macro-level)
CREATE TABLE IF NOT EXISTS rounds (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id VARCHAR(128) NOT NULL,
  map_id VARCHAR(128),
  round_no INTEGER NOT NULL,
  round_start TIMESTAMP WITH TIME ZONE,
  round_end TIMESTAMP WITH TIME ZONE,
  winner_team VARCHAR(128),
  site_executed BOOLEAN,
  economy_snapshot JSONB,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_round_match_round UNIQUE (match_id, round_no)
);

CREATE INDEX IF NOT EXISTS idx_rounds_match_id ON rounds(match_id);
CREATE INDEX IF NOT EXISTS idx_rounds_map_id ON rounds(map_id);
CREATE INDEX IF NOT EXISTS idx_rounds_round_no ON rounds(round_no);

-- Micro actions table (micro-level signals)
CREATE TABLE IF NOT EXISTS micro_actions (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  signal_id VARCHAR(256) UNIQUE,
  match_id VARCHAR(128) NOT NULL,
  round_id VARCHAR(36) REFERENCES rounds(id) ON DELETE SET NULL,
  player_id VARCHAR(128),
  team VARCHAR(128),
  intent VARCHAR(128),
  confidence FLOAT,
  features JSONB,
  artifact_url VARCHAR(512),
  generated_at TIMESTAMP WITH TIME ZONE,
  ingestion_meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_micro_actions_signal_id ON micro_actions(signal_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_match_id ON micro_actions(match_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_round_id ON micro_actions(round_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_player_id ON micro_actions(player_id);
CREATE INDEX IF NOT EXISTS idx_micro_actions_team ON micro_actions(team);
CREATE INDEX IF NOT EXISTS idx_micro_actions_intent ON micro_actions(intent);

-- Macro outcomes table (materialized per-round/team)
CREATE TABLE IF NOT EXISTS macro_outcomes (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  round_id VARCHAR(36) NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  match_id VARCHAR(128),
  team VARCHAR(128),
  round_win BOOLEAN,
  econ_delta INTEGER,
  site_executed BOOLEAN,
  outcome_meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT uq_macro_round_team UNIQUE (round_id, team)
);

CREATE INDEX IF NOT EXISTS idx_macro_outcomes_round_id ON macro_outcomes(round_id);
CREATE INDEX IF NOT EXISTS idx_macro_outcomes_match_id ON macro_outcomes(match_id);
CREATE INDEX IF NOT EXISTS idx_macro_outcomes_team ON macro_outcomes(team);

-- Correlation results table (store computed correlations)
CREATE TABLE IF NOT EXISTS correlation_results (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  metric_name VARCHAR(128),
  feature_name VARCHAR(128),
  outcome_name VARCHAR(128),
  correlation FLOAT,
  p_value FLOAT,
  p_value_bh FLOAT,
  effect_size FLOAT,
  direction VARCHAR(16),
  method VARCHAR(64),
  sample_size INTEGER,
  significant BOOLEAN,
  extra JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_correlation_results_metric_name ON correlation_results(metric_name);
CREATE INDEX IF NOT EXISTS idx_correlation_results_feature_name ON correlation_results(feature_name);
CREATE INDEX IF NOT EXISTS idx_correlation_results_outcome_name ON correlation_results(outcome_name);
CREATE INDEX IF NOT EXISTS idx_correlation_results_p_value ON correlation_results(p_value);
CREATE INDEX IF NOT EXISTS idx_correlation_results_significant ON correlation_results(significant);
CREATE INDEX IF NOT EXISTS idx_correlation_results_created_at ON correlation_results(created_at);

-- For SQLite compatibility (if using SQLite instead of Postgres)
-- Note: SQLite doesn't support gen_random_uuid(), so use Python's uuid.uuid4() instead
-- The models_analytics.py already handles this with default=lambda: str(uuid.uuid4())

