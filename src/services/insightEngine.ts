// Insight Generation Engine
// Connects micro-mistakes to macro outcomes and generates actionable insights

import type { Insight } from '@/types';
import type { MicroAnalysisResult } from './heuristicEngine';
import type { PatternAnalysisResult } from './patternRecognition';
import type { PredictiveAnalysisResult } from './predictiveAnalytics';

export interface InsightGenerationResult {
  insights: Insight[];
  prioritized_insights: Insight[];
  action_plan: ActionPlan;
}

export interface ActionPlan {
  immediate_actions: ActionItem[];
  practice_focus: PracticeFocus[];
  strategic_adjustments: StrategicAdjustment[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  player_id?: string;
  deadline?: string;
  impact: 'high' | 'medium' | 'low';
}

export interface PracticeFocus {
  area: string;
  description: string;
  drills: string[];
  expected_improvement: string;
}

export interface StrategicAdjustment {
  strategy_type: 'execute' | 'default' | 'retake' | 'economy';
  current_performance: number; // 0-1
  recommended_change: string;
  expected_impact: string;
}

class InsightEngine {
  /**
   * Generate comprehensive insights from all analysis results
   */
  generateInsights(
    microAnalysis: MicroAnalysisResult,
    patternAnalysis: PatternAnalysisResult,
    predictiveAnalysis: PredictiveAnalysisResult
  ): InsightGenerationResult {
    const insights: Insight[] = [];

    // Generate insights from micro-macro correlations
    for (const correlation of predictiveAnalysis.micro_macro_correlations) {
      if (correlation.correlation_strength > 0.5) {
        insights.push({
          id: `insight-${Date.now()}-${correlation.micro_action}`,
          type: 'warning',
          title: `${correlation.micro_action} Correlates with Round Losses`,
          description: `${correlation.micro_action} mistakes have a ${Math.round(correlation.correlation_strength * 100)}% correlation with round losses. ${correlation.recommendation}`,
          priority: correlation.correlation_strength > 0.7 ? 'high' : 'medium',
          created_at: new Date().toISOString(),
          actionable: true,
        });
      }
    }

    // Generate insights from team coordination
    if (patternAnalysis.team_coordination.overall_score < 0.6) {
      insights.push({
        id: `insight-${Date.now()}-coordination`,
        type: 'warning',
        title: 'Team Coordination Below Optimal',
        description: `Overall coordination score is ${Math.round(patternAnalysis.team_coordination.overall_score * 100)}%. Focus on utility timing (${Math.round(patternAnalysis.team_coordination.utility_timing * 100)}%) and trade efficiency (${Math.round(patternAnalysis.team_coordination.trade_efficiency * 100)}%).`,
        priority: 'high',
        created_at: new Date().toISOString(),
        actionable: true,
      });
    }

    // Generate insights from execute patterns
    for (const execute of patternAnalysis.execute_patterns) {
      if (execute.success_rate < 0.5) {
        insights.push({
          id: `insight-${Date.now()}-execute-${execute.site}`,
          type: 'warning',
          title: `Low Success Rate on ${execute.site} Executes`,
          description: `Execute success rate on ${execute.site} is only ${Math.round(execute.success_rate * 100)}%. Weaknesses: ${execute.weaknesses.join(', ')}.`,
          priority: 'high',
          created_at: new Date().toISOString(),
          actionable: true,
        });
      }
    }

    // Generate insights from economic predictions
    for (const prediction of predictiveAnalysis.economic_predictions) {
      if (prediction.risk_assessment === 'high' && prediction.win_probability < 0.5) {
        insights.push({
          id: `insight-${Date.now()}-economy-${prediction.round_number}`,
          type: 'warning',
          title: `High-Risk Economic Decision in Round ${prediction.round_number}`,
          description: `Recommended ${prediction.recommended_buy} has ${Math.round(prediction.win_probability * 100)}% win probability. ${prediction.reasoning}`,
          priority: 'medium',
          created_at: new Date().toISOString(),
          actionable: true,
        });
      }
    }

    // Generate insights from player fatigue
    for (const fatigue of predictiveAnalysis.player_fatigue_analysis) {
      if (fatigue.fatigue_score > 0.7) {
        insights.push({
          id: `insight-${Date.now()}-fatigue-${fatigue.player_id}`,
          type: 'warning',
          title: `Player ${fatigue.player_id} Showing Fatigue Signs`,
          description: `Fatigue score: ${Math.round(fatigue.fatigue_score * 100)}%. Decision quality trend: ${fatigue.decision_quality_trend}. ${fatigue.recommendations.join(' ')}`,
          priority: 'medium',
          player_id: fatigue.player_id,
          created_at: new Date().toISOString(),
          actionable: true,
        });
      }
    }

    // Generate positive insights
    for (const execute of patternAnalysis.execute_patterns) {
      if (execute.success_rate > 0.7) {
        insights.push({
          id: `insight-${Date.now()}-success-${execute.site}`,
          type: 'success',
          title: `Strong ${execute.site} Execute Pattern`,
          description: `${execute.site} executes have ${Math.round(execute.success_rate * 100)}% success rate. Strengths: ${execute.strengths.join(', ')}.`,
          priority: 'low',
          created_at: new Date().toISOString(),
          actionable: false,
        });
      }
    }

    // Generate improvement insights from technical issues
    const highSeverityIssues = microAnalysis.technical_issues.filter(
      (issue) => issue.severity > 0.7
    );

    for (const issue of highSeverityIssues) {
      insights.push({
        id: `insight-${Date.now()}-technical-${issue.player_id}`,
        type: 'improvement',
        title: `${issue.issue_type} Issue Detected`,
        description: `${issue.description}. ${issue.recommendation}`,
        priority: issue.severity > 0.8 ? 'high' : 'medium',
        player_id: issue.player_id,
        created_at: new Date().toISOString(),
        actionable: true,
      });
    }

    // Prioritize insights
    const prioritized = this.prioritizeInsights(insights);

    // Generate action plan
    const actionPlan = this.generateActionPlan(
      microAnalysis,
      patternAnalysis,
      predictiveAnalysis,
      insights
    );

    return {
      insights,
      prioritized_insights: prioritized,
      action_plan: actionPlan,
    };
  }

  /**
   * Prioritize insights by importance and urgency
   */
  private prioritizeInsights(insights: Insight[]): Insight[] {
    return [...insights].sort((a, b) => {
      // Priority order: high > medium > low
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by type: warning > improvement > success > info
      const typeOrder = { warning: 4, improvement: 3, success: 2, info: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });
  }

  /**
   * Generate actionable action plan
   */
  private generateActionPlan(
    microAnalysis: MicroAnalysisResult,
    patternAnalysis: PatternAnalysisResult,
    predictiveAnalysis: PredictiveAnalysisResult,
    insights: Insight[]
  ): ActionPlan {
    const immediateActions: ActionItem[] = [];
    const practiceFocus: PracticeFocus[] = [];
    const strategicAdjustments: StrategicAdjustment[] = [];

    // Extract immediate actions from high-priority insights
    const highPriorityInsights = insights.filter((i) => i.priority === 'high' && i.actionable);
    for (const insight of highPriorityInsights) {
      immediateActions.push({
        id: `action-${insight.id}`,
        title: insight.title,
        description: insight.description,
        priority: 'high',
        player_id: insight.player_id,
        impact: 'high',
      });
    }

    // Generate practice focus from technical issues
    const technicalIssues = microAnalysis.technical_issues;
    const issuesByType = this.groupByType(technicalIssues);

    for (const [issueType, issues] of Object.entries(issuesByType)) {
      if (issues.length > 0) {
        practiceFocus.push({
          area: issueType,
          description: `${issues.length} ${issueType} issue(s) detected`,
          drills: this.getDrillsForIssueType(issueType),
          expected_improvement: `Reduce ${issueType} issues by 30-40%`,
        });
      }
    }

    // Generate strategic adjustments from pattern analysis
    for (const recommendation of patternAnalysis.recommendations) {
      strategicAdjustments.push({
        strategy_type: recommendation.type,
        current_performance: 0.5, // Would calculate from actual data
        recommended_change: recommendation.description,
        expected_impact: recommendation.expected_impact,
      });
    }

    return {
      immediate_actions: immediateActions,
      practice_focus: practiceFocus,
      strategic_adjustments: strategicAdjustments,
    };
  }

  /**
   * Group items by type
   */
  private groupByType<T extends { issue_type?: string }>(items: T[]): Record<string, T[]> {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
      const type = item.issue_type || 'unknown';
      if (!groups[type]) groups[type] = [];
      groups[type].push(item);
    }
    return groups;
  }

  /**
   * Get practice drills for issue type
   */
  private getDrillsForIssueType(issueType: string): string[] {
    const drillMap: Record<string, string[]> = {
      crosshair_placement: [
        'Headshot-only deathmatch',
        'Angle holding practice',
        'Pre-aim common angles',
      ],
      utility_timing: [
        'Execute timing drills',
        'Utility coordination practice',
        'Smoke/flash timing exercises',
      ],
      positioning: [
        'Position review sessions',
        'Off-angle practice',
        'Cover usage drills',
      ],
      economy: [
        'Economic decision scenarios',
        'Buy round planning',
        'Force buy vs save analysis',
      ],
      trading: [
        'Trade kill practice',
        'Team coordination drills',
        'Reaction time training',
      ],
    };

    return drillMap[issueType] || ['General practice drills'];
  }
}

export const insightEngine = new InsightEngine();

// Export createInsightEngine from personalized engine for backward compatibility
export { createInsightEngine } from './personalizedInsightEngine';
