// Formatter Agent - Formats insights into coach-friendly output
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';
import type { PatternAnalysisResult } from './MicroPatternDetectorAgent';
import type { StrategicAnalysisResult } from './StrategicAnalyzerAgent';

export interface FormattedInsight {
  id: string;
  type: 'warning' | 'improvement' | 'success' | 'info';
  title: string;
  description: string;
  player_id?: string;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  actionable: boolean;
  recommendation?: string;
  data_points?: unknown[];
}

export interface FormattingResult {
  insights: FormattedInsight[];
  summary: string;
  key_findings: string[];
  recommendations: string[];
}

class FormatterAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'Formatter',
      AgentRole.FORMATTER,
      {
        formatting: true,
      },
      {
        enabled: true,
        ...config,
      }
    );
  }

  async processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: FormattingResult;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { patterns, correlations, player_data } = task.input_data as {
        patterns?: PatternAnalysisResult;
        correlations?: StrategicAnalysisResult;
        player_data?: { id: string; name?: string };
      };

      const insights: FormattedInsight[] = [];
      const keyFindings: string[] = [];
      const recommendations: string[] = [];

      // Format critical insights from correlations
      if (correlations?.critical_insights) {
        for (const insight of correlations.critical_insights) {
          const formatted: FormattedInsight = {
            id: `insight-${Date.now()}-${Math.random()}`,
            type: insight.severity === 'CRITICAL' ? 'warning' : 'improvement',
            title: this.generateTitle(insight),
            description: insight.statement,
            player_id: player_data?.id,
            priority: insight.severity === 'CRITICAL' ? 'high' : 'medium',
            created_at: new Date().toISOString(),
            actionable: true,
            recommendation: insight.recommendation,
            data_points: insight.data_points,
          };

          insights.push(formatted);
          keyFindings.push(insight.statement);
          if (insight.recommendation) {
            recommendations.push(insight.recommendation);
          }
        }
      }

      // Format patterns as insights
      if (patterns?.critical_patterns) {
        for (const pattern of patterns.critical_patterns) {
          const formatted: FormattedInsight = {
            id: `pattern-${Date.now()}-${Math.random()}`,
            type: 'info',
            title: this.formatPatternTitle(pattern),
            description: this.formatPatternDescription(pattern),
            player_id: player_data?.id,
            priority: pattern.impact_score > 0.8 ? 'high' : 'medium',
            created_at: new Date().toISOString(),
            actionable: true,
            recommendation: this.generatePatternRecommendation(pattern),
          };

          insights.push(formatted);
        }
      }

      // Generate summary
      const summary = this.generateSummary(insights, patterns, correlations);

      const processingTime = this.getProcessingTime();

      return {
        success: true,
        result: {
          insights,
          summary,
          key_findings: keyFindings,
          recommendations: recommendations,
        },
        processing_time_ms: processingTime,
        task_type: 'formatting',
        accuracy: 1.0, // Formatting is deterministic
      };
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'formatting',
      };
    }
  }

  private generateTitle(insight: { severity: string; statement: string }): string {
    if (insight.severity === 'CRITICAL') {
      return 'Critical Issue Detected';
    }
    if (insight.severity === 'HIGH') {
      return 'High Priority Improvement';
    }
    return 'Performance Insight';
  }

  private formatPatternTitle(pattern: { type: string; impact_score: number }): string {
    const typeMap: Record<string, string> = {
      OPENING_DUEL_PATTERN: 'Opening Duel Performance',
      UTILITY_INEFFICIENCY: 'Utility Usage Efficiency',
      POSITIONING_PATTERN: 'Positioning Pattern',
    };

    return typeMap[pattern.type] || 'Performance Pattern';
  }

  private formatPatternDescription(pattern: {
    type: string;
    impact_score: number;
    pattern: unknown;
  }): string {
    const patternData = pattern.pattern as {
      win_rate?: number;
      efficiency?: number;
      sample_size?: number;
    };

    if (pattern.type === 'OPENING_DUEL_PATTERN' && patternData.win_rate !== undefined) {
      return `Opening duel win rate: ${Math.round(patternData.win_rate * 100)}% (Impact: ${Math.round(pattern.impact_score * 100)}%)`;
    }

    if (pattern.type === 'UTILITY_INEFFICIENCY' && patternData.efficiency !== undefined) {
      return `Utility efficiency: ${Math.round(patternData.efficiency * 100)}% (Impact: ${Math.round(pattern.impact_score * 100)}%)`;
    }

    return `Pattern detected with ${Math.round(pattern.impact_score * 100)}% impact score`;
  }

  private generatePatternRecommendation(_pattern: { type: string }): string {
    const recommendationMap: Record<string, string> = {
      OPENING_DUEL_PATTERN:
        'Practice opening duels and improve crosshair placement. Focus on positioning and timing.',
      UTILITY_INEFFICIENCY:
        'Review utility usage timing and coordination. Practice utility lineups.',
      POSITIONING_PATTERN:
        'Analyze positioning patterns and identify optimal positions for different scenarios.',
    };

    return (
      recommendationMap[_pattern.type] ||
      'Review this pattern and identify improvement opportunities.'
    );
  }

  private generateSummary(
    insights: FormattedInsight[],
    patterns?: PatternAnalysisResult,
    correlations?: StrategicAnalysisResult
  ): string {
    const criticalCount = insights.filter((i) => i.priority === 'high').length;
    const totalPatterns = patterns?.patterns_found || 0;
    const totalCorrelations = correlations?.total_correlations || 0;

    return (
      `Analysis complete: ${insights.length} insights generated (${criticalCount} critical). ` +
      `Detected ${totalPatterns} patterns and ${totalCorrelations} correlations.`
    );
  }
}

export const formatterAgent = new FormatterAgent();
