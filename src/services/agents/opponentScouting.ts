// Opponent Scouting Agent
// Automates opponent analysis to predict their tactics
// Generates scouting reports with preferred compositions and tendencies

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentTool,
  OpponentScoutingOutput,
  ScoutingReport,
  PredictedTactic,
  OpponentVulnerability,
  CompositionPreference,
  KeyPlayer,
  MapTendency,
  ClutchPerformance,
} from '@/types/agents';

export class OpponentScoutingAgent extends BaseAgentImpl {
  name = 'Opponent Scouting Agent';
  role = 'opponent_scouting' as const;
  description =
    'Analyzes opponent historical data and VODs to generate scouting reports, predict tactics, and identify vulnerabilities.';

  async execute(input: AgentInput): Promise<OpponentScoutingOutput> {
    const opponentData = input.opponent_data;
    const matchContext = input.match_context;

    if (!opponentData && !matchContext?.opponent_team) {
      throw new Error('No opponent data provided to Opponent Scouting Agent');
    }

    // Step 1: Build scouting report
    const scoutingReport = await this.buildScoutingReport(opponentData, matchContext);

    // Step 2: Predict tactics
    const predictedTactics = await this.predictTactics(scoutingReport, matchContext);

    // Step 3: Identify vulnerabilities
    const vulnerabilities = this.identifyVulnerabilities(scoutingReport, predictedTactics);

    // Step 4: Build insights
    const insights = [
      ...predictedTactics.map((t) => ({
        id: t.tactic_id,
        type: 'scouting' as const,
        title: `Predicted: ${t.description}`,
        description: `Likelihood: ${Math.round(t.likelihood * 100)}%. Counter: ${t.counter_strategy}`,
        severity: t.likelihood,
        actionable: true,
        related_data: t,
      })),
      ...vulnerabilities.map((v) => ({
        id: v.vulnerability_id,
        type: 'scouting' as const,
        title: `Vulnerability: ${v.description}`,
        description: `Exploitability: ${Math.round(v.exploitability * 100)}%`,
        severity: v.exploitability,
        actionable: true,
        related_data: v,
      })),
    ];

    const recommendations = [
      ...predictedTactics.map((t) => t.counter_strategy),
      ...vulnerabilities.map((v) => v.recommended_exploit),
    ];

    return {
      ...this.createBaseOutput(insights, recommendations, 0.78),
      scouting_report: scoutingReport,
      predicted_tactics: predictedTactics,
      vulnerabilities: vulnerabilities,
    };
  }

  private async buildScoutingReport(
    opponentData?: unknown,
    matchContext?: unknown
  ): Promise<ScoutingReport> {
    const od = opponentData as {
      team_name?: string;
      preferred_compositions?: string[];
      map_tendencies?: Array<{ map: string; preferred_sites?: string[]; common_strategies?: string[]; success_rate?: number }>;
      clutch_performance?: ClutchPerformance;
      key_players?: KeyPlayer[];
    } | undefined;
    const mc = matchContext as { opponent_team?: string; map?: string } | undefined;

    const teamName = od?.team_name || mc?.opponent_team || 'Unknown Team';

    const prompt = this.buildScoutingPrompt(od, mc);
    const llmAnalysis = await this.callLLM(
      prompt,
      'You are an expert esports analyst. Analyze opponent data and generate a comprehensive scouting report.'
    );

    const preferredCompositions = this.extractCompositionPreferences(od, mc);
    const mapTendencies = this.extractMapTendencies(od);
    const clutchPerformance = this.extractClutchPerformance(od);
    const keyPlayers = this.identifyKeyPlayers(od);

    return {
      team_name: teamName,
      preferred_compositions: preferredCompositions,
      map_specific_tendencies: mapTendencies,
      clutch_performance: clutchPerformance,
      playstyle_analysis: llmAnalysis,
      key_players: keyPlayers,
    };
  }

  private buildScoutingPrompt(
    opponentData?: { team_name?: string; preferred_compositions?: string[]; map_tendencies?: Array<{ map: string; preferred_sites?: string[] }> },
    matchContext?: { opponent_team?: string; map?: string }
  ): string {
    return `Analyze the following opponent data:

Team: ${opponentData?.team_name || matchContext?.opponent_team || 'Unknown'}
Map: ${matchContext?.map || 'Unknown'}

Preferred Compositions:
${opponentData?.preferred_compositions?.join(', ') || 'Unknown'}

Map Tendencies:
${opponentData?.map_tendencies?.map((t) => `- ${t.map}: ${t.preferred_sites?.join(', ')}`).join('\n') || 'Unknown'}

Generate a playstyle analysis covering:
1. Overall strategy approach (aggressive/defensive/mixed)
2. Preferred round phases (early/mid/late)
3. Utility usage patterns
4. Economic decision-making
5. Team coordination style`;
  }

  private extractCompositionPreferences(
    opponentData?: { preferred_compositions?: string[] },
    matchContext?: { map?: string }
  ): CompositionPreference[] {
    const compositions: CompositionPreference[] = [];

    if (opponentData?.preferred_compositions && opponentData.preferred_compositions.length > 0) {
      // Split compositions into groups of 5 agents
      const compArray = opponentData.preferred_compositions;
      for (let i = 0; i < compArray.length; i += 5) {
        const comp = compArray.slice(i, i + 5);
        if (comp.length > 0) {
          compositions.push({
            composition: comp,
            frequency: 0.7,
            success_rate: 0.65,
            maps: [matchContext?.map || 'all'],
          });
        }
      }
    }
    
    if (compositions.length === 0) {
      compositions.push({
        composition: ['Jett', 'Omen', 'Sage', 'Sova', 'Killjoy'],
        frequency: 0.5,
        success_rate: 0.6,
        maps: ['all'],
      });
    }

    return compositions;
  }

  private extractMapTendencies(
    opponentData?: { map_tendencies?: Array<{ map: string; preferred_sites?: string[]; common_strategies?: string[]; success_rate?: number }> }
  ): MapTendency[] {
    if (opponentData?.map_tendencies) {
      return opponentData.map_tendencies.map((t) => ({
        map: t.map,
        preferred_sites: t.preferred_sites || ['A'],
        common_strategies: t.common_strategies || ['Standard execute'],
        success_rate: t.success_rate ?? 0.6,
      }));
    }

    return [
      {
        map: 'Bind',
        preferred_sites: ['A'],
        common_strategies: ['Fast A execute', 'B split'],
        success_rate: 0.6,
      },
    ];
  }

  private extractClutchPerformance(
    opponentData?: { clutch_performance?: ClutchPerformance }
  ): ClutchPerformance {
    if (opponentData?.clutch_performance) {
      return {
        one_v_one: opponentData.clutch_performance.one_v_one ?? 0.55,
        one_v_two: opponentData.clutch_performance.one_v_two ?? 0.35,
        one_v_three: opponentData.clutch_performance.one_v_three ?? 0.20,
        one_v_four: opponentData.clutch_performance.one_v_four ?? 0.10,
        one_v_five: opponentData.clutch_performance.one_v_five ?? 0.05,
      };
    }

    return {
      one_v_one: 0.55,
      one_v_two: 0.35,
      one_v_three: 0.20,
      one_v_four: 0.10,
      one_v_five: 0.05,
    };
  }

  private identifyKeyPlayers(
    opponentData?: { key_players?: KeyPlayer[] }
  ): KeyPlayer[] {
    if (opponentData?.key_players) {
      return opponentData.key_players;
    }

    return [
      {
        player_id: 'opponent-1',
        role: 'duelist',
        strengths: ['Entry fragging', 'Clutch situations'],
        weaknesses: ['Utility usage'],
        impact_rating: 0.8,
      },
    ];
  }

  private async predictTactics(
    scoutingReport: ScoutingReport,
    matchContext?: unknown
  ): Promise<PredictedTactic[]> {
    const tactics: PredictedTactic[] = [];
    const mc = matchContext as { map?: string } | undefined;

    const prompt = `Based on this scouting report, predict likely tactics:

Team: ${scoutingReport.team_name}
Map: ${mc?.map || 'Unknown'}
Preferred Compositions: ${scoutingReport.preferred_compositions.map((c) => c.composition.join(', ')).join('; ')}
Map Tendencies: ${scoutingReport.map_specific_tendencies.map((t) => `${t.map}: ${t.preferred_sites.join(', ')}`).join('; ')}

Predict 3-5 likely tactics they will use.`;

    await this.callLLM(
      prompt,
      'You are a tactical predictor. Analyze opponent tendencies and predict their likely strategies.'
    );

    for (const tendency of scoutingReport.map_specific_tendencies) {
      for (const site of tendency.preferred_sites) {
        tactics.push({
          tactic_id: `tactic-${tendency.map}-${site}`,
          description: `Fast ${site} site execute on ${tendency.map}`,
          likelihood: tendency.success_rate,
          conditions: [`Map: ${tendency.map}`, `Site: ${site}`],
          counter_strategy: `Stack utility on ${site}, prepare quick rotate`,
        });
      }
    }

    if (tactics.length === 0) {
      tactics.push({
        tactic_id: 'tactic-default-1',
        description: 'Standard execute on A site',
        likelihood: 0.6,
        conditions: ['Standard round'],
        counter_strategy: 'Maintain standard defensive setup',
      });
    }

    return tactics;
  }

  private identifyVulnerabilities(
    scoutingReport: ScoutingReport,
    predictedTactics: PredictedTactic[]
  ): OpponentVulnerability[] {
    const vulnerabilities: OpponentVulnerability[] = [];

    if (scoutingReport.clutch_performance.one_v_three < 0.3) {
      vulnerabilities.push({
        vulnerability_id: 'vuln-clutch',
        description: 'Weak in 1v3+ clutch situations',
        exploitability: 0.7,
        recommended_exploit: 'Force 1v3+ scenarios through coordinated pushes',
      });
    }

    const retakeTactics = predictedTactics.filter((t) =>
      t.description.toLowerCase().includes('retake')
    );
    if (retakeTactics.length === 0 || (retakeTactics[0] && retakeTactics[0].likelihood < 0.5)) {
      vulnerabilities.push({
        vulnerability_id: 'vuln-retake',
        description: 'Struggles with retake scenarios',
        exploitability: 0.65,
        recommended_exploit: 'Plant spike early and force retake situations',
      });
    }

    for (const tendency of scoutingReport.map_specific_tendencies) {
      if (tendency.success_rate < 0.5) {
        vulnerabilities.push({
          vulnerability_id: `vuln-${tendency.map}`,
          description: `Low success rate on ${tendency.map}`,
          exploitability: 1 - tendency.success_rate,
          recommended_exploit: `Force them to play ${tendency.map} if possible`,
        });
      }
    }

    return vulnerabilities;
  }

  getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_historical_matches',
        description: 'Analyzes opponent historical match data',
        input_schema: {
          type: 'object',
          properties: {
            match_data: { type: 'array' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { analyzed: true };
        },
      },
      {
        name: 'extract_composition_patterns',
        description: 'Extracts preferred agent compositions from match data',
        input_schema: {
          type: 'object',
          properties: {
            matches: { type: 'array' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { patterns_extracted: true };
        },
      },
    ];
  }
}
