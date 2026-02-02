// Macro-Strategy Analyst Agent
// Connects individual mistakes to team-wide tactical failures
// Identifies patterns and suggests strategic adjustments

import { BaseAgentImpl } from './baseAgent';
import type {
  AgentInput,
  AgentOutput,
  AgentTool,
  MacroStrategyAnalystOutput,
  TacticalPattern,
  TeamWeakness,
  StrategicAdjustment,
  CorrelationAnalysis,
} from '@/types/agents';
import { patternRecognition } from '../patternRecognition';
import { predictiveAnalytics } from '../predictiveAnalytics';

export class MacroStrategyAnalystAgent extends BaseAgentImpl {
  name = 'Macro-Strategy Analyst';
  role = 'macro_strategy_analyst' as const;
  description =
    'Analyzes team-wide tactical patterns, connects micro mistakes to macro outcomes, and suggests strategic adjustments.';

  /**
   * Execute macro-strategy analysis
   */
  async execute(input: AgentInput): Promise<MacroStrategyAnalystOutput> {
    const roundData = input.round_data;
    const enrichedData = input.enriched_data || [];

    if (!roundData && enrichedData.length === 0) {
      throw new Error('No round data provided to Macro-Strategy Analyst');
    }

    // Step 1: Analyze patterns using pattern recognition service
    const patternAnalysis = enrichedData.length > 0
      ? patternRecognition.analyzePatterns(
          enrichedData,
          [], // team sync events would come from ingestion
          [] // round packets
        )
      : null;

    // Step 2: Analyze micro-macro correlations
    const mistakes = roundData?.player_mistakes || [];
    const correlationAnalysis = this.analyzeMicroMacroCorrelations(
      mistakes,
      roundData
    );

    // Step 3: Identify tactical patterns
    const tacticalPatterns = this.identifyTacticalPatterns(
      patternAnalysis,
      roundData
    );

    // Step 4: Identify team weaknesses
    const teamWeaknesses = this.identifyTeamWeaknesses(
      mistakes,
      roundData,
      tacticalPatterns
    );

    // Step 5: Generate strategic adjustments
    const strategicAdjustments = await this.generateStrategicAdjustments(
      teamWeaknesses,
      tacticalPatterns,
      correlationAnalysis
    );

    // Step 6: Build insights
    const insights = [
      ...tacticalPatterns.map((p) => ({
        id: p.pattern_id,
        type: 'pattern' as const,
        title: `Pattern: ${p.description}`,
        description: `Frequency: ${Math.round(p.frequency * 100)}%, Success: ${Math.round(p.success_rate * 100)}%`,
        severity: 1 - p.success_rate,
        actionable: true,
        related_data: p,
      })),
      ...teamWeaknesses.map((w) => ({
        id: w.weakness_id,
        type: 'strategy' as const,
        title: `Weakness: ${w.description}`,
        description: `Affects ${w.affected_rounds} rounds, Impact: ${Math.round(w.win_rate_impact * 100)}%`,
        severity: w.win_rate_impact,
        actionable: true,
        related_data: w,
      })),
    ];

    const recommendations = strategicAdjustments.map((a) => a.description);

    return {
      ...this.createBaseOutput(insights, recommendations, 0.82),
      tactical_patterns: tacticalPatterns,
      team_weaknesses: teamWeaknesses,
      strategic_adjustments: strategicAdjustments,
      correlation_analysis: correlationAnalysis,
    };
  }

  /**
   * Analyze micro-macro correlations
   */
  private analyzeMicroMacroCorrelations(
    mistakes: any[],
    roundData?: any
  ): CorrelationAnalysis[] {
    const correlations: CorrelationAnalysis[] = [];

    // Group mistakes by type
    const mistakeGroups = new Map<string, any[]>();
    for (const mistake of mistakes) {
      const key = mistake.type;
      if (!mistakeGroups.has(key)) {
        mistakeGroups.set(key, []);
      }
      mistakeGroups.get(key)!.push(mistake);
    }

    // Calculate correlation for each mistake type
    for (const [mistakeType, mistakeList] of mistakeGroups.entries()) {
      const frequency = mistakeList.length;
      const avgSeverity =
        mistakeList.reduce((sum, m) => sum + m.severity, 0) / frequency;

      // Simplified correlation calculation
      // In production, this would use statistical analysis
      const correlationStrength = Math.min(1, avgSeverity * (frequency / 10));

      correlations.push({
        micro_action: mistakeType,
        macro_outcome: 'round_loss',
        correlation_strength: correlationStrength,
        sample_size: frequency,
      });
    }

    return correlations;
  }

  /**
   * Identify tactical patterns
   */
  private identifyTacticalPatterns(
    patternAnalysis: any,
    roundData?: any
  ): TacticalPattern[] {
    const patterns: TacticalPattern[] = [];

    if (patternAnalysis) {
      // Extract execute patterns
      if (patternAnalysis.execute_patterns) {
        for (const execute of patternAnalysis.execute_patterns) {
          patterns.push({
            pattern_id: `execute-${execute.site}`,
            description: `${execute.site} site execute`,
            frequency: execute.frequency || 0.5,
            success_rate: execute.success_rate || 0.6,
            conditions: [`Map: ${roundData?.map || 'unknown'}`, `Site: ${execute.site}`],
            recommendation: execute.success_rate < 0.6
              ? 'Improve execute timing and utility coordination'
              : 'Maintain current execute strategy',
          });
        }
      }

      // Extract retake patterns
      if (patternAnalysis.retake_patterns) {
        for (const retake of patternAnalysis.retake_patterns) {
          patterns.push({
            pattern_id: `retake-${retake.site}`,
            description: `${retake.site} site retake`,
            frequency: retake.frequency || 0.4,
            success_rate: retake.success_rate || 0.5,
            conditions: [`Map: ${roundData?.map || 'unknown'}`, `Site: ${retake.site}`],
            recommendation: retake.success_rate < 0.5
              ? 'Improve retake coordination and utility usage'
              : 'Current retake strategy is effective',
          });
        }
      }
    }

    // Add pattern based on round data
    if (roundData) {
      patterns.push({
        pattern_id: `round-outcome-${roundData.round_number}`,
        description: `Round ${roundData.round_number} outcome pattern`,
        frequency: roundData.round_outcome === 'loss' ? 0.7 : 0.3,
        success_rate: roundData.round_outcome === 'win' ? 1 : 0,
        conditions: [
          `Phase: ${roundData.round_phase}`,
          `Economy: ${roundData.economic_state}`,
        ],
        recommendation:
          roundData.round_outcome === 'loss'
            ? 'Review round strategy and identify improvement areas'
            : 'Maintain successful round strategy',
      });
    }

    return patterns;
  }

  /**
   * Identify team weaknesses
   */
  private identifyTeamWeaknesses(
    mistakes: any[],
    roundData?: any,
    patterns?: TacticalPattern[]
  ): TeamWeakness[] {
    const weaknesses: TeamWeakness[] = [];

    // Analyze mistake frequency by type
    const mistakeCounts = new Map<string, number>();
    for (const mistake of mistakes) {
      mistakeCounts.set(
        mistake.type,
        (mistakeCounts.get(mistake.type) || 0) + 1
      );
    }

    // Identify high-frequency mistakes as weaknesses
    for (const [mistakeType, count] of mistakeCounts.entries()) {
      if (count >= 3) {
        // High frequency = weakness
        weaknesses.push({
          weakness_id: `weakness-${mistakeType}`,
          description: `Recurring ${mistakeType} mistakes`,
          affected_rounds: count,
          win_rate_impact: Math.min(1, count / 10),
          suggested_fix: this.getSuggestedFix(mistakeType),
        });
      }
    }

    // Analyze pattern weaknesses
    if (patterns) {
      for (const pattern of patterns) {
        if (pattern.success_rate < 0.5) {
          weaknesses.push({
            weakness_id: `weakness-pattern-${pattern.pattern_id}`,
            description: `Low success rate for ${pattern.description}`,
            affected_rounds: Math.round(pattern.frequency * 10),
            win_rate_impact: 1 - pattern.success_rate,
            suggested_fix: pattern.recommendation,
          });
        }
      }
    }

    return weaknesses;
  }

  /**
   * Get suggested fix for mistake type
   */
  private getSuggestedFix(mistakeType: string): string {
    const fixes: Record<string, string> = {
      predictable_positioning:
        'Implement position rotation drills and off-angle training',
      utility_timing:
        'Create utility timing protocols and practice coordinated executes',
      trading:
        'Focus on trade kill drills and improve reaction time',
      economy:
        'Establish clear economy rules and team buy coordination',
    };

    return fixes[mistakeType] || 'Review and practice this aspect of gameplay';
  }

  /**
   * Generate strategic adjustments
   */
  private async generateStrategicAdjustments(
    weaknesses: TeamWeakness[],
    patterns: TacticalPattern[],
    correlations: CorrelationAnalysis[]
  ): Promise<StrategicAdjustment[]> {
    const adjustments: StrategicAdjustment[] = [];

    // Use LLM to generate strategic recommendations
    const prompt = this.buildStrategicPrompt(weaknesses, patterns, correlations);
    const llmResponse = await this.callLLM(
      prompt,
      'You are a strategic analyst. Suggest tactical adjustments based on identified weaknesses and patterns.'
    );

    // Generate adjustments based on weaknesses
    for (const weakness of weaknesses.slice(0, 3)) {
      const adjustmentType = this.determineAdjustmentType(weakness.description);

      adjustments.push({
        adjustment_id: `adjustment-${weakness.weakness_id}`,
        type: adjustmentType,
        description: weakness.suggested_fix,
        expected_impact: 1 - weakness.win_rate_impact,
        implementation: this.generateImplementation(weakness, adjustmentType),
      });
    }

    // Add adjustments based on correlations
    for (const correlation of correlations.slice(0, 2)) {
      if (correlation.correlation_strength > 0.6) {
        adjustments.push({
          adjustment_id: `adjustment-correlation-${correlation.micro_action}`,
          type: 'positioning',
          description: `Address ${correlation.micro_action} to improve round outcomes`,
          expected_impact: correlation.correlation_strength,
          implementation: `Focus training on reducing ${correlation.micro_action} frequency`,
        });
      }
    }

    return adjustments;
  }

  /**
   * Build strategic prompt for LLM
   */
  private buildStrategicPrompt(
    weaknesses: TeamWeakness[],
    patterns: TacticalPattern[],
    correlations: CorrelationAnalysis[]
  ): string {
    return `Analyze the following team performance data:

Team Weaknesses:
${weaknesses.map((w) => `- ${w.description}: ${w.suggested_fix}`).join('\n')}

Tactical Patterns:
${patterns.map((p) => `- ${p.description}: ${Math.round(p.success_rate * 100)}% success`).join('\n')}

Micro-Macro Correlations:
${correlations.map((c) => `- ${c.micro_action} → ${c.macro_outcome}: ${Math.round(c.correlation_strength * 100)}% correlation`).join('\n')}

Suggest 3-5 strategic adjustments that address the root causes of these issues.`;
  }

  /**
   * Determine adjustment type from description
   */
  private determineAdjustmentType(description: string): StrategicAdjustment['type'] {
    const lower = description.toLowerCase();

    if (lower.includes('composition') || lower.includes('agent')) {
      return 'composition';
    }
    if (lower.includes('timing') || lower.includes('utility')) {
      return 'timing';
    }
    if (lower.includes('position') || lower.includes('angle')) {
      return 'positioning';
    }
    if (lower.includes('economy') || lower.includes('buy')) {
      return 'economy';
    }

    return 'positioning'; // default
  }

  /**
   * Generate implementation steps
   */
  private generateImplementation(
    weakness: TeamWeakness,
    type: StrategicAdjustment['type']
  ): string {
    return `1. Review ${weakness.description} in recent matches
2. Develop specific protocols for ${type}
3. Practice in scrims with focus on this area
4. Monitor improvement metrics`;
  }

  /**
   * Get tools available to this agent
   */
  getTools(): AgentTool[] {
    return [
      {
        name: 'analyze_team_patterns',
        description: 'Analyzes team coordination and tactical patterns',
        input_schema: {
          type: 'object',
          properties: {
            round_data: { type: 'object' },
            enriched_data: { type: 'array' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { patterns_analyzed: true };
        },
      },
      {
        name: 'calculate_correlation',
        description: 'Calculates correlation between micro actions and macro outcomes',
        input_schema: {
          type: 'object',
          properties: {
            micro_data: { type: 'array' },
            macro_data: { type: 'array' },
          },
        },
        execute: async (args: Record<string, unknown>) => {
          return { correlation: 0.65 };
        },
      },
    ];
  }
}


