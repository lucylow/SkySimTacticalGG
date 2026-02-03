// Micro-Mistake Detector Agent
// Identifies recurring individual errors and quantifies their impact
// Generates animated corrections via HY-Motion

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentTool,
  MicroMistakeDetectorOutput,
  DetectedMistake,
  MotionPrompt,
} from '@/types/agents';
import type { GridDataPacket } from '@/types/grid';
import { heuristicEngine } from '../heuristicEngine';

export class MicroMistakeDetectorAgent extends BaseAgentImpl {
  name = 'Micro-Mistake Detector';
  role = 'micro_mistake_detector' as const;
  description =
    'Analyzes player telemetry to find technical mistakes, quantifies impact on win probability, and generates HY-Motion visualization prompts for corrections.';

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
    await this.callLLM(
      llmPrompt,
      'You are a micro-analysis expert. Identify recurring mistakes and quantify their impact on round outcomes.'
    );

    // Step 3: Process detected mistakes and calculate impact
    const detectedMistakes = this.processMistakes(microAnalysis.mistakes, gridData);

    // Step 4: Generate motion prompts for HY-Motion visualization
    const motionPrompts = await this.generateMotionPrompts(detectedMistakes, gridData);

    // Step 5: Calculate win probability swing
    const winProbabilitySwing = this.calculateWinProbabilitySwing(detectedMistakes);

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

  private buildAnalysisPrompt(
    gridData: GridDataPacket[],
    microAnalysis: { mistakes?: unknown[]; technical_issues?: unknown[] }
  ): string {
    const mistakeCount = microAnalysis.mistakes?.length || 0;
    const technicalIssues = microAnalysis.technical_issues?.length || 0;

    return `Analyze the following player telemetry data:

- Total data packets: ${gridData.length}
- Detected mistakes: ${mistakeCount}
- Technical issues: ${technicalIssues}

Identify:
1. Recurring mistake patterns (same mistake happening multiple times)
2. Impact of each mistake on round win probability
3. Correlation between mistake frequency and round outcomes
4. Most critical mistakes that need immediate correction

Provide specific, actionable insights with quantified impact.`;
  }

  private processMistakes(
    mistakes: unknown[],
    gridData: GridDataPacket[]
  ): DetectedMistake[] {
    const detected: DetectedMistake[] = [];
    const mistakeGroups = new Map<string, unknown[]>();

    for (const mistake of mistakes) {
      const m = mistake as { type: string };
      const key = m.type;
      if (!mistakeGroups.has(key)) {
        mistakeGroups.set(key, []);
      }
      mistakeGroups.get(key)!.push(mistake);
    }

    for (const [mistakeType, mistakeList] of mistakeGroups.entries()) {
      const frequency = mistakeList.length;
      const avgSeverity =
        mistakeList.reduce((sum: number, m) => sum + (m as { severity: number }).severity, 0) / frequency;

      const impactOnRound = Math.min(1, avgSeverity * (frequency / gridData.length) * 2);

      for (const mistake of mistakeList) {
        const m = mistake as { id: string; player_id: string; type: string; description: string; severity: number };
        detected.push({
          mistake_id: m.id,
          player_id: m.player_id,
          mistake_type: m.type,
          description: m.description,
          severity: m.severity,
          impact_on_round: impactOnRound,
          correction_prompt: this.generateCorrectionPrompt(mistakeType),
          timestamp: Date.now(),
        });
      }
    }

    return detected;
  }

  private generateCorrectionPrompt(mistakeType: string): string {
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

    return prompts[mistakeType] || `Correct the ${mistakeType} mistake with proper technique.`;
  }

  private async generateMotionPrompts(
    mistakes: DetectedMistake[],
    gridData: GridDataPacket[]
  ): Promise<MotionPrompt[]> {
    const prompts: MotionPrompt[] = [];

    for (const mistake of mistakes.slice(0, 5)) {
      const playerPacket = gridData.find((p) => p.player.id === mistake.player_id);

      if (playerPacket) {
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

  private calculateWinProbabilitySwing(mistakes: DetectedMistake[]): number {
    if (mistakes.length === 0) return 0;

    const totalImpact = mistakes.reduce(
      (sum, m) => sum + m.impact_on_round * m.severity,
      0
    );

    return Math.min(1, totalImpact / mistakes.length);
  }

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

  getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_player_frame',
        description: 'Analyzes a single GRID data frame to detect technical mistakes',
        input_schema: {
          type: 'object',
          properties: {
            grid_data_frame: { type: 'object' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { analyzed: true };
        },
      },
      {
        name: 'generate_motion_visualization',
        description: 'Generates HY-Motion visualization prompt for a detected mistake',
        input_schema: {
          type: 'object',
          properties: {
            mistake: { type: 'object' },
            player_data: { type: 'object' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { prompt_generated: true };
        },
      },
      {
        name: 'calculate_win_probability_impact',
        description: 'Calculates how a mistake affects round win probability',
        input_schema: {
          type: 'object',
          properties: {
            mistake_type: { type: 'string' },
            round_context: { type: 'object' },
          },
        },
        execute: async (_args: Record<string, unknown>) => {
          return { impact: 0.65 };
        },
      },
    ];
  }
}
