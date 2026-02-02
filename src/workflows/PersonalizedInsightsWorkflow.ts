// Personalized Insights Workflow
import { orchestratorAgent } from '@/agents/OrchestratorAgent';
import { agentMonitor } from '@/agents/monitoring';
import type { AgentRequest, WorkflowExecution, WorkflowStage } from '@/agents/types';
import { WorkflowType, RequestType } from '@/agents/types';

export class PersonalizedInsightsWorkflow {
  async execute(request: AgentRequest): Promise<WorkflowExecution> {
    const workflowId = `workflow-${Date.now()}-${Math.random()}`;
    const stages: WorkflowStage[] = [];
    const startTime = Date.now();

    try {
      // Stage 1: Data Collection
      const stage1Start = Date.now();
      const dataRequest: AgentRequest = {
        id: request.id,
        type: RequestType.INSIGHTS,
        player_id: request.player_id,
        match_ids: request.match_ids,
      };
      
      const result = await orchestratorAgent.processRequest(dataRequest);
      
      stages.push({
        stage: 'data_collection',
        duration_ms: Date.now() - stage1Start,
        agent_role: result.workflow_type === WorkflowType.PERSONALIZED_INSIGHTS ? undefined : undefined,
        data_points: this.extractDataPoints(result.results),
      });

      // Extract insights from result
      const insights = (result.results as { insights?: unknown[] }).insights || [];
      const confidence = (result.results as { confidence?: number }).confidence || 0;

      const totalTime = Date.now() - startTime;

      // Track agent performance
      agentMonitor.trackAgentPerformance('Orchestrator', {
        success: true,
        processing_time_ms: totalTime,
        task_type: 'personalized_insights',
        accuracy: confidence,
      });

      return {
        workflow_id: workflowId,
        workflow_type: WorkflowType.PERSONALIZED_INSIGHTS,
        request_id: request.id,
        stages,
        agents_used: result.agents_used,
        total_time_ms: totalTime,
        status: 'completed',
        results: {
          insights,
          confidence,
          raw_results: result.results,
        },
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      agentMonitor.trackAgentPerformance('Orchestrator', {
        success: false,
        processing_time_ms: totalTime,
        task_type: 'personalized_insights',
      });

      return {
        workflow_id: workflowId,
        workflow_type: WorkflowType.PERSONALIZED_INSIGHTS,
        request_id: request.id,
        stages,
        agents_used: 0,
        total_time_ms: totalTime,
        status: 'failed',
        error: errorMessage,
        created_at: new Date().toISOString(),
      };
    }
  }

  private extractDataPoints(results: unknown): number {
    // Extract data points count from results
    if (typeof results === 'object' && results !== null) {
      const resultsObj = results as Record<string, unknown>;
      const dataFetcherResult = resultsObj[WorkflowType.PERSONALIZED_INSIGHTS] as {
        matches?: Array<{ events?: unknown[] }>;
      } | undefined;
      
      if (dataFetcherResult?.matches) {
        return dataFetcherResult.matches.reduce(
          (sum, m) => sum + (m.events?.length || 0),
          0
        );
      }
    }
    return 0;
  }
}

export const personalizedInsightsWorkflow = new PersonalizedInsightsWorkflow();


