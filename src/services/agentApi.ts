// Agent API Service - Frontend service for interacting with agent system
import type { AgentRequest, AgentStatus, WorkflowExecution } from '@/agents/types';
import { RequestType } from '@/agents/types';
import { agentMonitor } from '@/agents/monitoring';
import { personalizedInsightsWorkflow } from '@/workflows/PersonalizedInsightsWorkflow';
import { macroReviewWorkflow } from '@/workflows/MacroReviewWorkflow';
import { hypotheticalPredictionsWorkflow } from '@/workflows/HypotheticalPredictionsWorkflow';

class AgentApiService {
  /**
   * Get status of all agents
   */
  async getAgentStatus(): Promise<{
    status: string;
    timestamp: string;
    agents: Record<string, AgentStatus>;
    summary: {
      healthy_agents: number;
      total_agents: number;
      overall_success_rate: number;
    };
  }> {
    const report = agentMonitor.getAgentHealthReport();
    
    return {
      status: 'success',
      timestamp: new Date().toISOString(),
      agents: report.agent_details,
      summary: {
        healthy_agents: report.healthy_agents,
        total_agents: report.total_agents,
        overall_success_rate: report.overall_success_rate,
      },
    };
  }

  /**
   * Process a personalized insights request
   */
  async processPersonalizedInsights(request: {
    player_id: string;
    match_ids: string[];
  }): Promise<WorkflowExecution> {
    const agentRequest: AgentRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      type: RequestType.INSIGHTS,
      player_id: request.player_id,
      match_ids: request.match_ids,
    };

    return personalizedInsightsWorkflow.execute(agentRequest);
  }

  /**
   * Process a macro review request
   */
  async processMacroReview(request: {
    match_id: string;
    team_id?: string;
  }): Promise<WorkflowExecution> {
    const agentRequest: AgentRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      type: RequestType.REVIEW,
      match_ids: [request.match_id],
      team_id: request.team_id,
    };

    return macroReviewWorkflow.execute(agentRequest);
  }

  /**
   * Process a hypothetical prediction request
   */
  async processHypotheticalPrediction(request: {
    match_id: string;
    modification: Record<string, unknown>;
    base_state?: Record<string, unknown>;
  }): Promise<WorkflowExecution> {
    const agentRequest: AgentRequest = {
      id: `req-${Date.now()}-${Math.random()}`,
      type: RequestType.PREDICTION,
      match_ids: [request.match_id],
      modification: request.modification,
      base_state: request.base_state,
    };

    return hypotheticalPredictionsWorkflow.execute(agentRequest);
  }

  /**
   * Send a task to a specific agent (for testing/debugging)
   */
  async sendAgentTask(
    _agentRole: string,
    _task: Record<string, unknown>
  ): Promise<unknown> {
    // This would typically be used for direct agent interaction
    // In a real implementation, would route through orchestrator
    throw new Error('Direct agent task sending not implemented. Use workflow methods instead.');
  }
}

export const agentApi = new AgentApiService();


