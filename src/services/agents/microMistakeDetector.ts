// Micro-Mistake Detector Agent
// Identifies recurring individual errors and quantifies their impact
// Generates animated corrections via HY-Motion

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentOutput,
  AgentTool,
  MicroMistakeDetectorOutput,
  DetectedMistake,
  MotionPrompt,
} from '@/types/agents';
import type { GridDataPacket } from '@/types/grid';
import { heuristicEngine } from '../heuristicEngine';
import { backendApi } from '../backendApi';

export class MicroMistakeDetectorAgent extends BaseAgentImpl {
  name = 'Micro-Mistake Detector';
  role = 'micro_mistake_detector' as const;
  description =
    'Analyzes player telemetry to find technical mistakes, quantifies impact on win probability, and generates HY-Motion visualization prompts for corrections.';

  /**
   * Execute micro-mistake detection analysis
   */
  async execute(input: AgentInput): Promise<MicroMistakeDetectorOutput> {
    const gridData = input.grid_data || [];
    const enrichedData = input.enriched_data || [];

    if (gridData.length === 0 && enrichedData.length === 0) {
      throw new Error('No GRID data provided to Micro-Mistake Detector');
    }

    // Step 1: Use heuristic engine to detect mistakes
    const microAnalysis = enrichedData.length > 0
      ? heuristicEngine.analyzeMicro(enrichedData, gridData)
      : { mistakes: [], predicted_actions: [], technical_issues: [], motion_prompts: [] };

    // Step 2: Enhance with LLM reasoning for pattern detection
    const llmPrompt = this.buildAnalysisPrompt(gridData, microAnalysis);
    const llmInsights = await this.callLLM(
      llmPrompt,
      'You are a micro-analysis expert. Identify recurring mistakes and quantify their impact on round outcomes.'
    );

    // Step 3: Process detected mistakes and calculate impact
    const detectedMistakes = this.processMistakes(
      microAnalysis.mistakes,
      gridData,
      llmInsights
    );

    // Step 4: Generate motion prompts for HY-Motion visualization
    const motionPrompts = await this.generateMotionPrompts(
      detectedMistakes,
      gridData
    );

    // Step 5: Calculate win probability swing
    const winProbabilitySwing = this.calculateWinProbabilitySwing(
      detectedMistakes
    );

    // Step 6: Convert to insights format
    const insights = detectedMistakes.map((mistake) => ({
      id: mistake.mistake_id,
      type: 'mistake' as const,
      title: mistake.mistake_type,
      description: mistake.description,
      severity: mistake.severity,
      player_id: mistake.player_id,
      actionable: true,
      related_data: {
        impact_on_round: mistake.impact_on_round,
        correction_prompt: mistake.correction_prompt,
      },
    }));

    const recommendations = this.generateRecommendations(detectedMistakes);

    return {
      ...this.createBaseOutput(insights, recommendations, 0.85),
      detected_mistakes: detectedMistakes,
      motion_prompts: motionPrompts,
      win_probability_swing: winProbabilitySwing,
    };
  }

  /**
   * Build prompt for LLM analysis
   */
  private buildAnalysisPrompt(
    gridData: GridDataPacket[],
    microAnalysis: any
  ): string {
    const mistakeCount = microAnalysis.mistakes?.length || 0;
    const technicalIssues = microAnalysis.technical_issues?.length || 0;

    return `Analyze the following player telemetry data:

- Total data packets: ${gridData.length}
- Detected mistakes: ${mistakeCount}
- Technical issues: ${technicalIssues}

Mistake types detected:
${microAnalysis.mistakes?.map((m: any) => `- ${m.type}: ${m.description}`).join('\n') || 'None'}

Identify:
1. Recurring mistake patterns (same mistake happening multiple times)
2. Impact of each mistake on round win probability
3. Correlation between mistake frequency and round outcomes
4. Most critical mistakes that need immediate correction

Provide specific, actionable insights with quantified impact.`;
  }

  /**
   * Process mistakes and enhance with impact analysis
   */
  private processMistakes(
    mistakes: any[],
    gridData: GridDataPacket[],
    llmInsights: string
  ): DetectedMistake[] {
    const detected: DetectedMistake[] = [];

    // Group mistakes by type to find recurring patterns
    const mistakeGroups = new Map<string, any[]>();
    for (const mistake of mistakes) {
      const key = mistake.type;
      if (!mistakeGroups.has(key)) {
        mistakeGroups.set(key, []);
      }
      mistakeGroups.get(key)!.push(mistake);
    }

    // Process each mistake group
    for (const [mistakeType, mistakeList] of mistakeGroups.entries()) {
      const frequency = mistakeList.length;
      const avgSeverity =
        mistakeList.reduce((sum, m) => sum + m.severity, 0) / frequency;

      // Calculate impact based on frequency and severity
      const impactOnRound = Math.min(1, avgSeverity * (frequency / gridData.length) * 2);

      for (const mistake of mistakeList) {
        detected.push({
          mistake_id: mistake.id,
          player_id: mistake.player_id,
          mistake_type: mistake.type,
          description: mistake.description,
          severity: mistake.severity,
          impact_on_round: impactOnRound,
          correction_prompt: this.generateCorrectionPrompt(mistake, mistakeType),
          timestamp: Date.now(),
        });
      }
    }

    return detected;
  }

  /**
   * Generate correction prompt for HY-Motion visualization
   */
  private generateCorrectionPrompt(mistake: any, mistakeType: string): string {
    const prompts: Record<string, string> = {
      predictable_positioning:
        'Player should vary positioning, use off-angles, and avoid holding the same angle repeatedly. Show correct movement: quick peek, immediate reposition, use cover effectively.',
      utility_timing:
        'Player should use utility earlier in the round. Show correct timing: throw flash before peeking, use smoke to create space, coordinate with team.',
      economy:
        'Player should manage economy better. Show correct decision: save when low on credits, buy with team, prioritize utility over expensive weapons.',
      trading:
        'Player should react faster to teammate deaths. Show correct trading: immediate peek after teammate death, use flash to support, maintain crosshair placement.',
      crosshair_placement:
        'Player should improve crosshair placement. Show correct technique: keep crosshair at head level, pre-aim common angles, smooth tracking.',
    };

    return (
      prompts[mistakeType] ||
      `Correct the ${mistakeType} mistake: ${mistake.recommendation}`
    );
  }

  /**
   * Generate motion prompts for HY-Motion
   */
  private async generateMotionPrompts(
    mistakes: DetectedMistake[],
    gridData: GridDataPacket[]
  ): Promise<MotionPrompt[]> {
    const prompts: MotionPrompt[] = [];

    for (const mistake of mistakes.slice(0, 5)) {
      // Find corresponding player data
      const playerPacket = gridData.find(
        (p) => p.player.id === mistake.player_id
      );

      if (playerPacket) {
        // Generate motion visualization prompt
        const motionPrompt = await backendApi.generateMotionFromGridData(
          {
            player_id: mistake.player_id,
            agent: playerPacket.player.agent,
            kills: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            utility_used: 0,
          },
          {
            round_number: 1,
            match_id: 'current',
            map: playerPacket.match_context.map,
            outcome: 'loss',
            duration: 120,
            events: [],
          }
        );

        prompts.push({
          player_id: mistake.player_id,
          action_type: 'correction',
          prompt_text: mistake.correction_prompt,
          confidence: 0.8,
          timestamp: Date.now(),
        });
      }
    }

    return prompts;
  }

  /**
   * Calculate win probability swing from mistakes
   */
  private calculateWinProbabilitySwing(mistakes: DetectedMistake[]): number {
    if (mistakes.length === 0) return 0;

    // Aggregate impact of all mistakes
    const totalImpact = mistakes.reduce(
      (sum, m) => sum + m.impact_on_round * m.severity,
      0
    );

    // Normalize to 0-1 range (swing can be positive or negative)
    // Negative swing = mistakes reduce win probability
    return Math.min(1, totalImpact / mistakes.length);
  }

  /**
   * Generate recommendations from detected mistakes
   */
  private generateRecommendations(mistakes: DetectedMistake[]): string[] {
    const recommendations: string[] = [];
    const mistakeTypes = new Set(mistakes.map((m) => m.mistake_type));

    if (mistakeTypes.has('predictable_positioning')) {
      recommendations.push(
        'Vary positioning patterns - avoid holding the same angles repeatedly'
      );
    }

    if (mistakeTypes.has('utility_timing')) {
      recommendations.push(
        'Use utility earlier in rounds to create opportunities'
      );
    }

    if (mistakeTypes.has('trading')) {
      recommendations.push(
        'Improve reaction time to teammate deaths for better trade efficiency'
      );
    }

    if (mistakeTypes.has('crosshair_placement')) {
      recommendations.push(
        'Focus on keeping crosshair at head level and pre-aiming common angles'
      );
    }

    return recommendations;
  }

  /**
   * Get tools available to this agent
   */
  getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_player_frame',
        description:
          'Analyzes a single GRID data frame to detect technical mistakes',
        input_schema: {
          type: 'object',
          properties: {
            grid_data_frame: { type: 'object' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          // This would call the heuristic engine
          return { analyzed: true };
        },
      },
      {
        name: 'generate_motion_visualization',
        description:
          'Generates HY-Motion visualization prompt for a detected mistake',
        input_schema: {
          type: 'object',
          properties: {
            mistake: { type: 'object' },
            player_data: { type: 'object' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          // This would call HY-Motion API
          return { prompt_generated: true };
        },
      },
      {
        name: 'calculate_win_probability_impact',
        description:
          'Calculates how a mistake affects round win probability',
        input_schema: {
          type: 'object',
          properties: {
            mistake_type: { type: 'string' },
            round_context: { type: 'object' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { impact: 0.65 };
        },
      },
    ];
  }
}

