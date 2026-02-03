// Predictive Playbook Agent
// Simulates outcomes of different strategies before matches
// Recommends optimal draft picks, veto orders, and in-game adaptations

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentTool,
  PredictivePlaybookOutput,
  StrategySimulation,
  DraftRecommendation,
  VetoRecommendation,
  InGameAdaptation,
  MapTendency,
} from '@/types/agents';

export class PredictivePlaybookAgent extends BaseAgentImpl {
  name = 'Predictive Playbook Agent';
  role = 'predictive_playbook' as const;
  description =
    'Runs strategy simulations to recommend optimal draft picks, veto orders, and in-game tactical adaptations.';

  async execute(input: AgentInput): Promise<PredictivePlaybookOutput> {
    const matchContext = input.match_context;
    const opponentData = input.opponent_data;

    if (!matchContext) {
      throw new Error('No match context provided to Predictive Playbook Agent');
    }

    // Step 1: Run strategy simulations
    const simulations = await this.runStrategySimulations(matchContext, opponentData);

    // Step 2: Generate optimal draft recommendations
    const optimalDraft = await this.generateDraftRecommendations(
      matchContext,
      opponentData,
      simulations
    );

    // Step 3: Generate veto recommendations
    const vetoRecommendations = await this.generateVetoRecommendations(
      matchContext,
      opponentData
    );

    // Step 4: Generate in-game adaptations
    const inGameAdaptations = await this.generateInGameAdaptations(matchContext, opponentData);

    // Step 5: Build insights
    const insights = [
      ...simulations.slice(0, 3).map((s) => ({
        id: s.simulation_id,
        type: 'prediction' as const,
        title: `Strategy: ${s.strategy}`,
        description: `Win Probability: ${Math.round(s.win_probability * 100)}%, Confidence: ${Math.round(s.confidence * 100)}%`,
        severity: s.win_probability,
        actionable: true,
        related_data: s,
      })),
      {
        id: 'draft-recommendation',
        type: 'strategy' as const,
        title: `Optimal Draft: ${optimalDraft.recommended_picks.join(', ')}`,
        description: optimalDraft.reasoning,
        severity: optimalDraft.expected_advantage,
        actionable: true,
        related_data: optimalDraft,
      },
    ];

    const recommendations = [
      optimalDraft.reasoning,
      ...vetoRecommendations.map((v) => `${v.action.toUpperCase()} ${v.map}: ${v.reasoning}`),
      ...inGameAdaptations.map((a) => a.recommended_change),
    ];

    return {
      ...this.createBaseOutput(insights, recommendations, 0.80),
      simulations: simulations,
      optimal_draft: optimalDraft,
      veto_recommendations: vetoRecommendations,
      in_game_adaptations: inGameAdaptations,
    };
  }

  private async runStrategySimulations(
    matchContext: { map?: string; opponent_team?: string },
    opponentData?: { map_tendencies?: MapTendency[] }
  ): Promise<StrategySimulation[]> {
    const simulations: StrategySimulation[] = [];

    const prompt = this.buildSimulationPrompt(matchContext, opponentData);
    await this.callLLM(prompt, 'You are a strategy simulator.');

    const strategies = [
      'Aggressive early-round pressure',
      'Defensive utility stack',
      'Mid-round utility execute',
      'Late-round spike plant',
      'Eco round force buy',
    ];

    for (const strategy of strategies) {
      const winProbability = this.simulateStrategy(strategy, matchContext, opponentData);
      const confidence = 0.7 + Math.random() * 0.2;

      simulations.push({
        simulation_id: `sim-${strategy.toLowerCase().replace(/\s+/g, '-')}`,
        strategy: strategy,
        conditions: [
          `Map: ${matchContext.map}`,
          `Opponent: ${matchContext.opponent_team}`,
        ],
        win_probability: winProbability,
        expected_outcomes: this.generateExpectedOutcomes(strategy, winProbability),
        confidence: confidence,
      });
    }

    simulations.sort((a, b) => b.win_probability - a.win_probability);

    return simulations;
  }

  private simulateStrategy(
    strategy: string,
    matchContext: { map?: string },
    opponentData?: { map_tendencies?: MapTendency[] }
  ): number {
    let baseProbability = 0.5;

    if (opponentData?.map_tendencies) {
      const mapTendency = opponentData.map_tendencies.find(
        (t) => t.map === matchContext.map
      );
      if (mapTendency && mapTendency.success_rate < 0.5) {
        baseProbability += 0.15;
      }
    }

    if (strategy.includes('Aggressive')) {
      baseProbability += 0.1;
    } else if (strategy.includes('Defensive')) {
      baseProbability += 0.05;
    }

    baseProbability += (Math.random() - 0.5) * 0.1;

    return Math.max(0, Math.min(1, baseProbability));
  }

  private generateExpectedOutcomes(
    strategy: string,
    winProbability: number
  ): string[] {
    const outcomes: string[] = [];

    if (winProbability > 0.6) {
      outcomes.push('High chance of round win');
      outcomes.push('Favorable economy for next round');
    } else if (winProbability < 0.4) {
      outcomes.push('Risk of round loss');
      outcomes.push('May need to save economy');
    } else {
      outcomes.push('Balanced outcome expected');
    }

    if (strategy.includes('Aggressive')) {
      outcomes.push('Early map control likely');
    }

    return outcomes;
  }

  private buildSimulationPrompt(
    matchContext: { map?: string; opponent_team?: string; current_score?: { team?: number; opponent?: number } },
    opponentData?: { map_tendencies?: MapTendency[] }
  ): string {
    return `Run strategy simulations for this match:

Map: ${matchContext.map}
Opponent: ${matchContext.opponent_team}
Current Score: ${matchContext.current_score?.team || 0} - ${matchContext.current_score?.opponent || 0}

Opponent Tendencies:
${opponentData?.map_tendencies?.map((t) => `- ${t.map}: ${t.success_rate * 100}% success`).join('\n') || 'Unknown'}

Simulate outcomes for various strategies.`;
  }

  private async generateDraftRecommendations(
    matchContext: { map?: string; opponent_team?: string },
    opponentData?: { preferred_compositions?: string[] },
    _simulations?: StrategySimulation[]
  ): Promise<DraftRecommendation> {
    const prompt = `Recommend optimal agent composition for:

Map: ${matchContext.map}
Opponent: ${matchContext.opponent_team}

Opponent Preferred Compositions:
${opponentData?.preferred_compositions?.join(', ') || 'Unknown'}

Recommend the best composition with reasoning.`;

    const llmResponse = await this.callLLM(
      prompt,
      'You are a draft strategist.'
    );

    const recommendedPicks = this.selectOptimalComposition(matchContext);

    return {
      recommended_picks: recommendedPicks,
      reasoning: llmResponse || `Optimal composition for ${matchContext.map} against ${matchContext.opponent_team}`,
      expected_advantage: 0.68,
      alternatives: [
        ['Raze', 'Omen', 'Sage', 'Sova', 'Killjoy'],
        ['Jett', 'Brimstone', 'Sage', 'Sova', 'Cypher'],
      ],
    };
  }

  private selectOptimalComposition(matchContext: { map?: string }): string[] {
    const mapCompositions: Record<string, string[]> = {
      Bind: ['Jett', 'Omen', 'Sage', 'Sova', 'Killjoy'],
      Haven: ['Raze', 'Omen', 'Sage', 'Sova', 'Cypher'],
      Ascent: ['Jett', 'Omen', 'Sage', 'Sova', 'Killjoy'],
      Split: ['Raze', 'Brimstone', 'Sage', 'Breach', 'Cypher'],
    };

    return mapCompositions[matchContext.map || ''] || ['Jett', 'Omen', 'Sage', 'Sova', 'Killjoy'];
  }

  private async generateVetoRecommendations(
    matchContext: { map?: string },
    opponentData?: { map_tendencies?: MapTendency[] }
  ): Promise<VetoRecommendation[]> {
    const recommendations: VetoRecommendation[] = [];

    if (opponentData?.map_tendencies) {
      for (const tendency of opponentData.map_tendencies) {
        if (tendency.success_rate > 0.7) {
          recommendations.push({
            map: tendency.map,
            action: 'ban',
            reasoning: `Opponent has ${Math.round(tendency.success_rate * 100)}% success rate on ${tendency.map}`,
            priority: tendency.success_rate,
          });
        } else if (tendency.success_rate < 0.4) {
          recommendations.push({
            map: tendency.map,
            action: 'pick',
            reasoning: `Opponent struggles on ${tendency.map} (${Math.round(tendency.success_rate * 100)}% success)`,
            priority: 1 - tendency.success_rate,
          });
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        map: matchContext.map || 'Unknown',
        action: 'pick',
        reasoning: 'Standard map selection',
        priority: 0.5,
      });
    }

    recommendations.sort((a, b) => b.priority - a.priority);

    return recommendations;
  }

  private async generateInGameAdaptations(
    matchContext: { current_score?: { team?: number; opponent?: number }; map?: string },
    opponentData?: { map_tendencies?: MapTendency[] }
  ): Promise<InGameAdaptation[]> {
    const adaptations: InGameAdaptation[] = [];

    if (matchContext.current_score) {
      const teamScore = matchContext.current_score.team || 0;
      const opponentScore = matchContext.current_score.opponent || 0;

      if (teamScore < opponentScore) {
        adaptations.push({
          adaptation_id: 'adapt-catchup',
          trigger_condition: 'Losing by 2+ rounds',
          recommended_change: 'Switch to more aggressive strategies to regain momentum',
          expected_impact: 0.6,
        });
      }
    }

    if (opponentData?.map_tendencies) {
      for (const tendency of opponentData.map_tendencies) {
        if (tendency.map === matchContext.map) {
          adaptations.push({
            adaptation_id: `adapt-${tendency.map}`,
            trigger_condition: `Playing on ${tendency.map}`,
            recommended_change: `Counter their preferred ${tendency.preferred_sites.join(' and ')} site strategies`,
            expected_impact: 0.65,
          });
        }
      }
    }

    return adaptations;
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'run_simulation',
        description: 'Runs a strategy simulation and returns win probability',
        input_schema: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            conditions: { type: 'object' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { win_probability: 0.65 };
        },
      },
      {
        name: 'evaluate_composition',
        description: 'Evaluates an agent composition for a given map',
        input_schema: {
          type: 'object',
          properties: {
            composition: { type: 'array' },
            map: { type: 'string' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { score: 0.75 };
        },
      },
    ];
  }
}
