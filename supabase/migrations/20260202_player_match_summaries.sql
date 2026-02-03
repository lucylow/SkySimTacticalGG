
CREATE TABLE IF NOT EXISTS player_match_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL,
  player_id uuid NOT NULL,
  provider text NOT NULL,
  kills int DEFAULT 0,
  deaths int DEFAULT 0,
  assists int DEFAULT 0,
  cs int DEFAULT 0,
  damage_dealt int DEFAULT 0,
  micro_signals jsonb DEFAULT '{}'::jsonb,
  computed_at timestamptz DEFAULT now(),
  UNIQUE (match_id, player_id)
);
