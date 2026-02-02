// Agent Configuration
import type { AgentConfig } from './types';
import { AgentRole } from './types';

export interface AgentSystemConfig {
  agents: Record<string, AgentConfig>;
  workflows: {
    personalized_insights: {
      enabled: boolean;
      max_execution_time: number;
      cache_ttl: number;
    };
    macro_review: {
      enabled: boolean;
      max_execution_time: number;
      sections_to_generate: number;
    };
    hypothetical_predictions: {
      enabled: boolean;
      max_execution_time: number;
      max_simulations_per_request: number;
    };
  };
  communication: {
    message_bus: {
      enabled: boolean;
      max_queue_size: number;
      retry_attempts: number;
    };
    monitoring: {
      enabled: boolean;
      metrics_interval: number;
      alert_thresholds: {
        success_rate: number;
        processing_time: number;
        error_rate: number;
      };
    };
  };
}

export const defaultAgentConfig: AgentSystemConfig = {
  agents: {
    [AgentRole.ORCHESTRATOR]: {
      enabled: true,
      max_concurrent_tasks: 10,
      timeout_seconds: 30,
    },
    [AgentRole.MICRO_ANALYZER]: {
      enabled: true,
      pattern_threshold: 0.7,
      sample_size_minimum: 10,
    },
    [AgentRole.STRATEGIC_ANALYZER]: {
      enabled: true,
      correlation_threshold: 0.6,
    },
    [AgentRole.SIMULATION_AGENT]: {
      enabled: true,
      default_simulations: 1000,
      max_simulations: 10000,
      confidence_threshold: 0.8,
    },
    [AgentRole.DATA_FETCHER]: {
      enabled: true,
    },
    [AgentRole.FORMATTER]: {
      enabled: true,
    },
    [AgentRole.VALIDATOR]: {
      enabled: true,
      confidence_threshold: 0.7,
    },
  },
  workflows: {
    personalized_insights: {
      enabled: true,
      max_execution_time: 60000, // 60 seconds
      cache_ttl: 3600, // 1 hour
    },
    macro_review: {
      enabled: true,
      max_execution_time: 45000, // 45 seconds
      sections_to_generate: 5,
    },
    hypothetical_predictions: {
      enabled: true,
      max_execution_time: 30000, // 30 seconds
      max_simulations_per_request: 5000,
    },
  },
  communication: {
    message_bus: {
      enabled: true,
      max_queue_size: 1000,
      retry_attempts: 3,
    },
    monitoring: {
      enabled: true,
      metrics_interval: 5000, // 5 seconds
      alert_thresholds: {
        success_rate: 0.7,
        processing_time: 5000, // 5 seconds
        error_rate: 0.1,
      },
    },
  },
};


