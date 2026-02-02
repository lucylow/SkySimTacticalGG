// Agent System Types

export enum AgentRole {
  DATA_FETCHER = 'data_fetcher',
  MICRO_ANALYZER = 'micro_analyzer',
  STRATEGIC_ANALYZER = 'strategic_analyzer',
  SIMULATION_AGENT = 'simulation_agent',
  FORMATTER = 'formatter',
  VALIDATOR = 'validator',
  ORCHESTRATOR = 'orchestrator',
  NARRATIVE_BUILDER = 'narrative_builder',
  AGENDA_GENERATOR = 'agenda_generator',
  PRIORITY_RANKER = 'priority_ranker',
}

export enum WorkflowType {
  PERSONALIZED_INSIGHTS = 'personalized_insights',
  MACRO_REVIEW = 'macro_review',
  HYPOTHETICAL_PREDICTIONS = 'hypothetical_predictions',
}

export enum RequestType {
  INSIGHTS = 'insights',
  REVIEW = 'review',
  PREDICTION = 'prediction',
}

export interface AgentTask {
  id: string;
  agent_role: AgentRole;
  task_description: string;
  input_data: Record<string, unknown>;
  expected_output: string;
  priority: number;
  dependencies: AgentRole[];
  created_at: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

export interface AgentCapabilities {
  pattern_recognition?: boolean;
  statistical_analysis?: boolean;
  anomaly_detection?: boolean;
  correlation_analysis?: boolean;
  impact_calculation?: boolean;
  strategy_recommendation?: boolean;
  monte_carlo_simulation?: boolean;
  probability_calculation?: boolean;
  scenario_modeling?: boolean;
  task_decomposition?: boolean;
  agent_coordination?: boolean;
  priority_management?: boolean;
  data_fetching?: boolean;
  formatting?: boolean;
  validation?: boolean;
}

export interface AgentConfig {
  enabled: boolean;
  max_concurrent_tasks?: number;
  timeout_seconds?: number;
  pattern_threshold?: number;
  sample_size_minimum?: number;
  correlation_threshold?: number;
  default_simulations?: number;
  max_simulations?: number;
  confidence_threshold?: number;
}

export interface AgentStatus {
  name: string;
  role: AgentRole;
  healthy: boolean;
  tasks_processed: number;
  success_rate: number;
  avg_processing_time_ms: number;
  recent_errors: AgentError[];
  specialties: Record<string, number>;
  last_active?: string;
  capabilities: AgentCapabilities;
}

export interface AgentError {
  timestamp: string;
  error: string;
  task_type?: string;
}

export interface AgentMessage {
  id: string;
  sender: string;
  receiver: string;
  message_type: 'task' | 'result' | 'query' | 'error';
  content: Record<string, unknown>;
  correlation_id: string;
  timestamp: number;
  priority: number;
  requires_response: boolean;
}

export interface WorkflowExecution {
  workflow_id: string;
  workflow_type: WorkflowType;
  request_id?: string;
  stages: WorkflowStage[];
  agents_used: number;
  total_time_ms: number;
  status: 'running' | 'completed' | 'failed';
  results?: unknown;
  error?: string;
  created_at: string;
}

export interface WorkflowStage {
  stage: string;
  duration_ms: number;
  agent_role?: AgentRole;
  data_points?: number;
  patterns_found?: number;
  correlations_found?: number;
  insights_generated?: number;
  validation_score?: number;
  visualizations_created?: number;
}

export interface AgentRequest {
  id: string;
  type: RequestType;
  player_id?: string;
  match_ids?: string[];
  team_id?: string;
  modification?: Record<string, unknown>;
  base_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}


