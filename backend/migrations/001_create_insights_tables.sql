-- Insights system database schema
-- Run this migration to create the insights, insight_reviews, and insight_audit tables

-- insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_text TEXT NOT NULL,        -- concise human-friendly insight title
  long_text TEXT,                  -- detailed prose + explanation
  evidence_json JSONB,             -- serialized evidence: charts URLs, sample events
  feature_name TEXT,
  outcome_name TEXT,
  correlation FLOAT,
  p_value FLOAT,
  effect_size FLOAT,
  direction TEXT,
  method TEXT,
  sample_size INT,
  generated_by TEXT,
  model_version TEXT,
  confidence FLOAT,
  status TEXT DEFAULT 'PENDING_REVIEW', -- PENDING_REVIEW | APPROVED | REJECTED | EDITED
  review_required BOOLEAN DEFAULT TRUE,
  not_for_betting BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insights_status ON insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_created_at ON insights(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_review_required ON insights(review_required) WHERE review_required = TRUE;

CREATE TABLE IF NOT EXISTS insight_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  reviewer TEXT,
  decision TEXT,  -- APPROVED / REJECTED / EDITED
  notes TEXT,
  changed_text TEXT,
  changed_evidence JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insight_reviews_insight_id ON insight_reviews(insight_id);
CREATE INDEX IF NOT EXISTS idx_insight_reviews_created_at ON insight_reviews(created_at DESC);

CREATE TABLE IF NOT EXISTS insight_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID,
  action TEXT,
  actor TEXT,
  details JSONB,
  ts TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_insight_audit_insight_id ON insight_audit(insight_id);
CREATE INDEX IF NOT EXISTS idx_insight_audit_ts ON insight_audit(ts DESC);


