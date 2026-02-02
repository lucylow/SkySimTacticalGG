// Insight Generation & Delivery System Types

export interface Insight {
  id: string;
  short_text: string;
  long_text?: string;
  evidence_json?: string | Record<string, unknown>;
  feature_name?: string;
  outcome_name?: string;
  correlation?: number;
  p_value?: number;
  effect_size?: number;
  direction?: string;
  method?: string;
  sample_size?: number;
  generated_by?: string;
  model_version?: string;
  confidence?: number;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EDITED';
  review_required?: boolean;
  not_for_betting?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface InsightReview {
  id: string;
  insight_id: string;
  reviewer: string;
  decision: 'APPROVED' | 'REJECTED' | 'EDITED';
  notes?: string;
  changed_text?: string;
  changed_evidence?: Record<string, unknown>;
  created_at: string;
}

export interface InsightEvidence {
  chart?: string; // base64 data URI or URL
  sample_events?: unknown[];
  [key: string]: unknown;
}


