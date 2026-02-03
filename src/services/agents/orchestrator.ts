// Agent Orchestrator
// Coordinates multiple agents to work together on analysis tasks

import type {
  AgentOrchestrationRequest,
  AgentOrchestrationResponse,
  AgentRole,
  AgentInput,
  AgentOutput,
  CombinedInsight,
} from '@/types/agents';
import { MicroMistakeDetectorAgent } from './microMistakeDetector';
import { MacroStrategyAnalystAgent } from './macroStrategyAnalyst';
import { OpponentScoutingAgent } from './opponentScouting';
import { PredictivePlaybookAgent } from './predictivePlaybook';
import { ProstheticCoachAgent } from './prostheticCoach';
import { LoLOpponentAnalysisAgent } from './lolOpponentAnalysis';
import { LoLGatherStrategyAgent } from './lolGatherStrategy';
import { MechanicalSkillAnalystAgent } from './mechanicalSkillAnalyst';
import { LoLQueueAnalystAgent } from './lolQueueAnalyst';

/**
 * Agent registry - maps roles to agent instances
 */
const agentRegistry = new Map<AgentRole, any>([
  ['micro_mistake_detector', new MicroMistakeDetectorAgent()],
  ['macro_strategy_analyst', new MacroStrategyAnalystAgent()],
  ['opponent_scouting', new OpponentScoutingAgent()],
  ['predictive_playbook', new PredictivePlaybookAgent()],
  ['prosthetic_coach', new ProstheticCoachAgent()],
  ['lol_opponent_analysis' as any, new LoLOpponentAnalysisAgent()],
  ['lol_queue_analyst' as any, new LoLQueueAnalystAgent()],
  ['lol_strategy' as any, new LoLGatherStrategyAgent()],
  ['mechanical_skill_analyst' as any, new MechanicalSkillAnalystAgent()],
]);

/**
 * Agent Orchestrator Service
 * Manages coordination between multiple agents
 */
export class AgentOrchestrator {
  /**
   * Execute orchestrated agent analysis
   */
  async orchestrate(
    request: AgentOrchestrationRequest
  ): Promise<AgentOrchestrationResponse> {
    const startTime = Date.now();
    const requestId = `orch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const agentOutputs: AgentOutput[] = [];
    let sharedContext: AgentInput = { ...request.input };

    // Execute agents based on coordination strategy
    switch (request.coordination_strategy || 'sequential') {
      case 'sequential':
        agentOutputs.push(...(await this.executeSequential(request, sharedContext)));
        break;

      case 'parallel':
        agentOutputs.push(...(await this.executeParallel(request, sharedContext)));
        break;

      case 'hierarchical':
        agentOutputs.push(...(await this.executeHierarchical(request, sharedContext)));
        break;

      default:
        agentOutputs.push(...(await this.executeSequential(request, sharedContext)));
    }

    // Combine insights from all agents
    const combinedInsights = this.combineInsights(agentOutputs);

    const executionTime = Date.now() - startTime;

    return {
      request_id: requestId,
      timestamp: Date.now(),
      agent_outputs: agentOutputs,
      combined_insights: combinedInsights,
      execution_time_ms: executionTime,
    };
  }

  /**
   * Execute agents sequentially (one after another)
   * Each agent can use outputs from previous agents
   */
  private async executeSequential(
    request: AgentOrchestrationRequest,
    context: AgentInput
  ): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];

    for (const role of request.agents) {
      const agent = agentRegistry.get(role);
      if (!agent) {
        console.warn(`Agent ${role} not found in registry`);
        continue;
      }

      // Execute agent with current context
      const output = await agent.execute(context);
      outputs.push(output);

      // Update context with agent output if context sharing is enabled
      if (request.context_sharing !== false) {
        context.previous_analysis = output;
        // Add agent-specific data to context
        this.enrichContextWithOutput(context, role, output);
      }
    }

    return outputs;
  }

  /**
   * Execute agents in parallel (simultaneously)
   * Agents work independently but can share initial context
   */
  private async executeParallel(
    request: AgentOrchestrationRequest,
    context: AgentInput
  ): Promise<AgentOutput[]> {
    const agentPromises = request.agents.map(async (role) => {
      const agent = agentRegistry.get(role);
      if (!agent) {
        console.warn(`Agent ${role} not found in registry`);
        return null;
      }

      return await agent.execute(context);
    });

    const outputs = await Promise.all(agentPromises);
    return outputs.filter((o): o is AgentOutput => o !== null);
  }

  /**
   * Execute agents hierarchically
   * Some agents depend on outputs from others
   */
  private async executeHierarchical(
    request: AgentOrchestrationRequest,
    context: AgentInput
  ): Promise<AgentOutput[]> {
    const outputs: AgentOutput[] = [];

    // Level 1: Data analysis agents (can run in parallel)
    const level1Agents: AgentRole[] = ['micro_mistake_detector', 'opponent_scouting'];
    const level1Outputs = await this.executeParallel(
      { ...request, agents: level1Agents.filter((a) => request.agents.includes(a)) },
      context
    );
    outputs.push(...level1Outputs);

    // Update context with level 1 outputs
    if (level1Outputs.length > 0) {
      context.previous_analysis = level1Outputs[0];
      for (const output of level1Outputs) {
        this.enrichContextWithOutput(context, output.agent_role, output);
      }
    }

    // Level 2: Strategy agents (depend on level 1)
    const level2Agents: AgentRole[] = ['macro_strategy_analyst', 'predictive_playbook'];
    const level2Outputs = await this.executeParallel(
      { ...request, agents: level2Agents.filter((a) => request.agents.includes(a)) },
      context
    );
    outputs.push(...level2Outputs);

    // Level 3: Real-time agents (can use all previous outputs)
    const level3Agents: AgentRole[] = ['prosthetic_coach'];
    const level3Outputs = await this.executeParallel(
      { ...request, agents: level3Agents.filter((a) => request.agents.includes(a)) },
      context
    );
    outputs.push(...level3Outputs);

    return outputs;
  }

  /**
   * Enrich context with agent output
   */
  private enrichContextWithOutput(
    context: AgentInput,
    role: AgentRole,
    output: AgentOutput
  ): void {
    switch (role) {
      case 'micro_mistake_detector':
        // Add detected mistakes to context
        if ('detected_mistakes' in output) {
          context.round_data = {
            ...context.round_data,
            player_mistakes: (output as any).detected_mistakes || [],
          } as any;
        }
        break;

      case 'opponent_scouting':
        // Add scouting data to context
        if ('scouting_report' in output) {
          context.opponent_data = {
            ...context.opponent_data,
            ...(output as any).scouting_report,
          } as any;
        }
        break;

      case 'macro_strategy_analyst':
        // Add strategic patterns to context
        if ('tactical_patterns' in output) {
          // Store in memory for future reference
          context.previous_analysis = {
            ...context.previous_analysis,
            tactical_patterns: (output as any).tactical_patterns,
          };
        }
        break;
    }
  }

  /**
   * Combine insights from multiple agents
   */
  private combineInsights(agentOutputs: AgentOutput[]): CombinedInsight[] {
    const combined: CombinedInsight[] = [];
    const insightMap = new Map<string, {
      sources: AgentRole[];
      insights: any[];
    }>();

    // Group insights by similarity
    for (const output of agentOutputs) {
      for (const insight of output.insights) {
        const key = `${insight.type}-${insight.title}`;
        if (!insightMap.has(key)) {
          insightMap.set(key, {
            sources: [],
            insights: [],
          });
        }

        const entry = insightMap.get(key)!;
        if (!entry.sources.includes(output.agent_role)) {
          entry.sources.push(output.agent_role);
        }
        entry.insights.push(insight);
      }
    }

    // Create combined insights
    for (const [key, entry] of insightMap.entries()) {
      const avgSeverity =
        entry.insights.reduce((sum, i) => sum + i.severity, 0) /
        entry.insights.length;
      const maxConfidence = Math.max(
        ...agentOutputs
          .filter((o) => entry.sources.includes(o.agent_role))
          .map((o) => o.confidence)
      );

      // Determine priority
      let priority: CombinedInsight['priority'] = 'low';
      if (avgSeverity > 0.8 || entry.sources.length >= 3) {
        priority = 'critical';
      } else if (avgSeverity > 0.6 || entry.sources.length >= 2) {
        priority = 'high';
      } else if (avgSeverity > 0.4) {
        priority = 'medium';
      }

      combined.push({
        insight_id: `combined-${key}`,
        source_agents: entry.sources,
        title: entry.insights[0].title,
        description: entry.insights[0].description,
        confidence: maxConfidence,
        priority,
        actionable: entry.insights.some((i) => i.actionable),
      });
    }

    // Sort by priority and confidence
    combined.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    return combined;
  }

  /**
   * Get a specific agent by role
   */
  getAgent(role: AgentRole): any | null {
    return agentRegistry.get(role) || null;
  }

  /**
   * Get all available agents
   */
  getAllAgents(): AgentRole[] {
    return Array.from(agentRegistry.keys());
  }
}

export const agentOrchestrator = new AgentOrchestrator();


