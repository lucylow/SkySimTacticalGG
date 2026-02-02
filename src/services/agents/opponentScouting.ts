// Opponent Scouting Agent
// Automates opponent analysis to predict their tactics
// Generates scouting reports with preferred compositions and tendencies

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentOutput,
  AgentTool,
  OpponentScoutingOutput,
  ScoutingReport,
  PredictedTactic,
  OpponentVulnerability,
  CompositionPreference,
  KeyPlayer,
} from '@/types/agents';

export class OpponentScoutingAgent extends BaseAgentImpl {
  name = 'Opponent Scouting Agent';
  role = 'opponent_scouting' as const;
  description =
    'Analyzes opponent historical data and VODs to generate scouting reports, predict tactics, and identify vulnerabilities.';

  /**
   * Execute opponent scouting analysis
   */
  async execute(input: AgentInput): Promise<OpponentScoutingOutput> {
    const opponentData = input.opponent_data;
    const matchContext = input.match_context;

    if (!opponentData && !matchContext?.opponent_team) {
      throw new Error('No opponent data provided to Opponent Scouting Agent');
    }

    // Step 1: Build scouting report
    const scoutingReport = await this.buildScoutingReport(
      opponentData,
      matchContext
    );

    // Step 2: Predict tactics
    const predictedTactics = await this.predictTactics(
      scoutingReport,
      matchContext
    );

    // Step 3: Identify vulnerabilities
    const vulnerabilities = this.identifyVulnerabilities(
      scoutingReport,
      predictedTactics
    );

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

  /**
   * Build comprehensive scouting report
   */
  private async buildScoutingReport(
    opponentData?: any,
    matchContext?: any
  ): Promise<ScoutingReport> {
    const teamName = opponentData?.team_name || matchContext?.opponent_team || 'Unknown Team';

    // Use LLM to analyze opponent data
    const prompt = this.buildScoutingPrompt(opponentData, matchContext);
    const llmAnalysis = await this.callLLM(
      prompt,
      'You are an expert esports analyst. Analyze opponent data and generate a comprehensive scouting report.'
    );

    // Extract composition preferences
    const preferredCompositions = this.extractCompositionPreferences(
      opponentData,
      matchContext
    );

    // Extract map tendencies
    const mapTendencies = this.extractMapTendencies(opponentData);

    // Extract clutch performance
    const clutchPerformance = this.extractClutchPerformance(opponentData);

    // Identify key players
    const keyPlayers = this.identifyKeyPlayers(opponentData);

    return {
      team_name: teamName,
      preferred_compositions: preferredCompositions,
      map_specific_tendencies: mapTendencies,
      clutch_performance: clutchPerformance,
      playstyle_analysis: llmAnalysis,
      key_players: keyPlayers,
    };
  }

  /**
   * Build scouting prompt for LLM
   */
  private buildScoutingPrompt(opponentData?: any, matchContext?: any): string {
    return `Analyze the following opponent data:

Team: ${opponentData?.team_name || matchContext?.opponent_team || 'Unknown'}
Historical Matches: ${opponentData?.historical_matches?.length || 0}
Map: ${matchContext?.map || 'Unknown'}

Preferred Compositions:
${opponentData?.preferred_compositions?.map((c: string[]) => `- ${c.join(', ')}`).join('\n') || 'Unknown'}

Map Tendencies:
${opponentData?.map_tendencies?.map((t: any) => `- ${t.map}: ${t.preferred_sites?.join(', ')}`).join('\n') || 'Unknown'}

Generate a playstyle analysis covering:
1. Overall strategy approach (aggressive/defensive/mixed)
2. Preferred round phases (early/mid/late)
3. Utility usage patterns
4. Economic decision-making
5. Team coordination style`;
  }

  /**
   * Extract composition preferences
   */
  private extractCompositionPreferences(
    opponentData?: any,
    matchContext?: any
  ): CompositionPreference[] {
    const compositions: CompositionPreference[] = [];

    if (opponentData?.preferred_compositions) {
      for (const comp of opponentData.preferred_compositions) {
        compositions.push({
          composition: comp,
          frequency: 0.7, // Would calculate from historical data
          success_rate: 0.65, // Would calculate from historical data
          maps: [matchContext?.map || 'all'],
        });
      }
    } else {
      // Default composition if no data
      compositions.push({
        composition: ['Jett', 'Omen', 'Sage', 'Sova', 'Killjoy'],
        frequency: 0.5,
        success_rate: 0.6,
        maps: ['all'],
      });
    }

    return compositions;
  }

  /**
   * Extract map tendencies
   */
  private extractMapTendencies(opponentData?: any): any[] {
    if (opponentData?.map_tendencies) {
      return opponentData.map_tendencies;
    }

    // Default tendencies if no data
    return [
      {
        map: 'Bind',
        preferred_sites: ['A'],
        common_strategies: ['Fast A execute', 'B split'],
        success_rate: 0.6,
      },
    ];
  }

  /**
   * Extract clutch performance
   */
  private extractClutchPerformance(opponentData?: any): any {
    if (opponentData?.clutch_performance) {
      return opponentData.clutch_performance;
    }

    // Default clutch performance
    return {
      one_v_one: 0.55,
      one_v_two: 0.35,
      one_v_three: 0.20,
      one_v_four: 0.10,
      one_v_five: 0.05,
    };
  }

  /**
   * Identify key players
   */
  private identifyKeyPlayers(opponentData?: any): KeyPlayer[] {
    const players: KeyPlayer[] = [];

    // Mock key players - in production, would analyze historical data
    if (!opponentData || !opponentData.key_players) {
      players.push({
        player_id: 'opponent-1',
        role: 'duelist',
        strengths: ['Entry fragging', 'Clutch situations'],
        weaknesses: ['Utility usage'],
        impact_rating: 0.8,
      });
    } else {
      return opponentData.key_players;
    }

    return players;
  }

  /**
   * Predict opponent tactics
   */
  private async predictTactics(
    scoutingReport: ScoutingReport,
    matchContext?: any
  ): Promise<PredictedTactic[]> {
    const tactics: PredictedTactic[] = [];

    // Use LLM to predict tactics
    const prompt = `Based on this scouting report, predict likely tactics:

Team: ${scoutingReport.team_name}
Map: ${matchContext?.map || 'Unknown'}
Preferred Compositions: ${scoutingReport.preferred_compositions.map((c) => c.composition.join(', ')).join('; ')}
Map Tendencies: ${scoutingReport.map_specific_tendencies.map((t) => `${t.map}: ${t.preferred_sites.join(', ')}`).join('; ')}

Predict 3-5 likely tactics they will use, including:
- Site preferences
- Timing patterns
- Utility usage
- Economic strategies`;

    const llmResponse = await this.callLLM(
      prompt,
      'You are a tactical predictor. Analyze opponent tendencies and predict their likely strategies.'
    );

    // Generate predicted tactics based on scouting report
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

    // Add default tactics if none found
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

  /**
   * Identify opponent vulnerabilities
   */
  private identifyVulnerabilities(
    scoutingReport: ScoutingReport,
    predictedTactics: PredictedTactic[]
  ): OpponentVulnerability[] {
    const vulnerabilities: OpponentVulnerability[] = [];

    // Analyze clutch performance for vulnerabilities
    if (scoutingReport.clutch_performance.one_v_three < 0.3) {
      vulnerabilities.push({
        vulnerability_id: 'vuln-clutch',
        description: 'Weak in 1v3+ clutch situations',
        exploitability: 0.7,
        recommended_exploit: 'Force 1v3+ scenarios through coordinated pushes',
      });
    }

    // Analyze retake performance
    const retakeTactics = predictedTactics.filter((t) =>
      t.description.toLowerCase().includes('retake')
    );
    if (retakeTactics.length === 0 || retakeTactics[0].likelihood < 0.5) {
      vulnerabilities.push({
        vulnerability_id: 'vuln-retake',
        description: 'Struggles with retake scenarios',
        exploitability: 0.65,
        recommended_exploit: 'Plant spike early and force retake situations',
      });
    }

    // Analyze map-specific vulnerabilities
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

  /**
   * Get tools available to this agent
   */
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
        execute: async (args: Record<string, unknown>) => {
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
        execute: async (args: Record<string, unknown>) => {
          return { patterns_extracted: true };
        },
      },
    ];
  }
}


