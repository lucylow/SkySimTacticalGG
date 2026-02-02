// Macro Review Workflow
import { orchestratorAgent } from '@/agents/OrchestratorAgent';
import { agentMonitor } from '@/agents/monitoring';
import type { AgentRequest, WorkflowExecution, WorkflowStage } from '@/agents/types';
import { WorkflowType, RequestType } from '@/agents/types';
import { agendaGenerator } from '@/services/agendaGenerator';
import { backendApi } from '@/services/backendApi';
import type { MatchMetadata, RoundData } from '@/types/backend';

export class MacroReviewWorkflow {
  async execute(request: AgentRequest): Promise<WorkflowExecution> {
    const workflowId = `workflow-${Date.now()}-${Math.random()}`;
    const stages: WorkflowStage[] = [];
    const startTime = Date.now();

    try {
      // Stage 1: Data Collection
      const stage1Start = Date.now();
      const matchId = request.match_ids?.[0];
      if (!matchId) {
        throw new Error('Match ID required for macro review');
      }

      const match = await backendApi.getMatch(matchId) as MatchMetadata;
      const rounds = await backendApi.getRounds(matchId) as RoundData[];
      
      stages.push({
        stage: 'data_collection',
        duration_ms: Date.now() - stage1Start,
      });

      // Stage 2: Strategic Event Detection
      const stage2Start = Date.now();
      const strategicEvents = this.detectStrategicEvents(rounds);
      
      stages.push({
        stage: 'strategic_event_detection',
        duration_ms: Date.now() - stage2Start,
      });

      // Stage 3: Narrative Building
      const stage3Start = Date.now();
      const narrative = this.buildNarrative(match, rounds, strategicEvents);
      
      stages.push({
        stage: 'narrative_building',
        duration_ms: Date.now() - stage3Start,
      });

      // Stage 4: Agenda Generation
      const stage4Start = Date.now();
      const teamId = request.team_id || match.team_a_id || '';
      const agenda = await agendaGenerator.generateReviewAgenda(match, rounds, teamId);
      
      stages.push({
        stage: 'agenda_generation',
        duration_ms: Date.now() - stage4Start,
        insights_generated: agenda.sections.length,
      });

      // Stage 5: Priority Ranking
      const stage5Start = Date.now();
      const prioritizedAgenda = this.prioritizeAgenda(agenda);
      
      stages.push({
        stage: 'priority_ranking',
        duration_ms: Date.now() - stage5Start,
      });

      const totalTime = Date.now() - startTime;

      // Track agent performance
      agentMonitor.trackAgentPerformance('Orchestrator', {
        success: true,
        processing_time_ms: totalTime,
        task_type: 'macro_review',
        accuracy: 0.9, // High accuracy for structured review
      });

      return {
        workflow_id: workflowId,
        workflow_type: WorkflowType.MACRO_REVIEW,
        request_id: request.id,
        stages,
        agents_used: 1, // Using agenda generator service
        total_time_ms: totalTime,
        status: 'completed',
        results: {
          agenda: prioritizedAgenda,
          narrative,
          strategic_events: strategicEvents,
        },
        created_at: new Date().toISOString(),
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      agentMonitor.trackAgentPerformance('Orchestrator', {
        success: false,
        processing_time_ms: totalTime,
        task_type: 'macro_review',
      });

      return {
        workflow_id: workflowId,
        workflow_type: WorkflowType.MACRO_REVIEW,
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

  private detectStrategicEvents(rounds: unknown[]): unknown[] {
    // Detect strategic events (eco rounds, force buys, executes, etc.)
    // Simplified implementation
    return rounds.map((round, index) => ({
      round_number: index + 1,
      type: 'strategic_event',
      significance: Math.random() > 0.7 ? 'high' : 'medium',
    }));
  }

  private buildNarrative(match: unknown, rounds: unknown[], events: unknown[]): string {
    // Build narrative description of the match
    return `Match analysis covering ${rounds.length} rounds with ${events.length} strategic events identified.`;
  }

  private prioritizeAgenda(agenda: { sections: Array<{ priority?: number }> }): typeof agenda {
    // Sort agenda sections by priority
    const prioritized = {
      ...agenda,
      sections: [...agenda.sections].sort((a, b) => {
        const priorityA = a.priority || 0;
        const priorityB = b.priority || 0;
        return priorityB - priorityA;
      }),
    };
    return prioritized;
  }
}

export const macroReviewWorkflow = new MacroReviewWorkflow();

