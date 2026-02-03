import { AgentOutput, AgentInsight } from './agents';

export interface QueueMetric {
  metric: string;
  solo: string | number;
  flex: string | number;
  impact: string;
}

export interface RoleImpact {
  solo: number;
  flex: number;
}

export interface QueueComparisonData {
  metrics: QueueMetric[];
  roleImpacts: Record<string, RoleImpact>;
  soloStrategy: {
    priorities: string[];
    keyStats: string[];
    winCondition: string;
  };
  flexStrategy: {
    priorities: string[];
    keyStats: string[];
    winCondition: string;
  };
  recommendation: 'SOLO' | 'FLEX';
}

export interface LoLQueueAnalysisOutput extends AgentOutput {
  comparisonData: QueueComparisonData;
}
