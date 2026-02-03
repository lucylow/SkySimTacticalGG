// Validator Agent - Validates insights for accuracy and relevance
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';
import type { FormattingResult } from './FormatterAgent';
import type { FetchedData } from './DataFetcherAgent';

export interface ValidationResult {
  confidence: number;
  validated_insights: Array<{
    insight: unknown;
    validation_score: number;
    is_valid: boolean;
    issues?: string[];
  }>;
  overall_quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

class ValidatorAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'Validator',
      AgentRole.VALIDATOR,
      {
        validation: true,
      },
      {
        enabled: true,
        confidence_threshold: 0.7,
        ...config,
      }
    );
  }

  async processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: ValidationResult & { critical_insights: unknown[] };
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { insights, raw_data } = task.input_data as {
        insights?: FormattingResult;
        raw_data?: FetchedData;
      };

      if (!insights) {
        throw new Error('Missing required input data: insights');
      }

      const validatedInsights = insights.insights.map((insight) => {
        const validationScore = this.validateInsight(insight, raw_data);
        const isValid = validationScore >= (this.config.confidence_threshold || 0.7);

        const issues: string[] = [];
        if (validationScore < 0.5) {
          issues.push('Low confidence score');
        }
        if (!insight.data_points || insight.data_points.length === 0) {
          issues.push('Missing data points');
        }
        if (!insight.recommendation) {
          issues.push('Missing actionable recommendation');
        }

        return {
          insight,
          validation_score: validationScore,
          is_valid: isValid,
          issues: issues.length > 0 ? issues : undefined,
        };
      });

      const avgValidationScore =
        validatedInsights.reduce((sum, v) => sum + v.validation_score, 0) /
        validatedInsights.length;

      const overallQuality = this.determineQuality(avgValidationScore);

      const criticalInsights = validatedInsights
        .filter((v) => v.is_valid && (v.insight as { priority?: string }).priority === 'high')
        .map((v) => v.insight);

      const recommendations = this.generateValidationRecommendations(validatedInsights);

      const processingTime = this.getProcessingTime();

      return await Promise.resolve({
        success: true,
        result: {
          confidence: avgValidationScore,
          validated_insights: validatedInsights,
          overall_quality: overallQuality,
          recommendations,
          critical_insights: criticalInsights,
        },
        processing_time_ms: processingTime,
        task_type: 'validation',
        accuracy: avgValidationScore,
      });
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return {
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'validation',
      };
    }
  }

  private validateInsight(
    insight: { data_points?: unknown[]; recommendation?: string; priority?: string },
    rawData?: FetchedData
  ): number {
    let score = 0.5; // Base score

    // Check data points
    if (insight.data_points && insight.data_points.length > 0) {
      score += 0.2;
      if (insight.data_points.length >= 5) {
        score += 0.1; // Bonus for sufficient data
      }
    }

    // Check recommendation
    if (insight.recommendation && insight.recommendation.length > 20) {
      score += 0.2;
    }

    // Check priority alignment
    if (insight.priority === 'high' && insight.data_points && insight.data_points.length >= 3) {
      score += 0.1;
    }

    // Verify against raw data if available
    if (rawData) {
      const dataConsistency = this.checkDataConsistency(insight, rawData);
      score += dataConsistency * 0.2;
    }

    return Math.min(1, score);
  }

  private checkDataConsistency(insight: { data_points?: unknown[] }, rawData: FetchedData): number {
    // Check if insight data points are consistent with raw data
    if (!insight.data_points || insight.data_points.length === 0) {
      return 0.5; // Neutral if no data points
    }

    // Simplified consistency check
    // In real implementation, would verify data points exist in raw data
    const totalRounds = rawData.matches?.reduce((sum, m) => sum + (m.rounds?.length || 0), 0) || 0;

    if (totalRounds > 0 && insight.data_points.length <= totalRounds) {
      return 1.0; // Consistent
    }

    return 0.7; // Partially consistent
  }

  private determineQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.7) return 'good';
    if (score >= 0.5) return 'fair';
    return 'poor';
  }

  private generateValidationRecommendations(
    validatedInsights: Array<{ validation_score: number; issues?: string[] }>
  ): string[] {
    const recommendations: string[] = [];

    const lowScoreCount = validatedInsights.filter((v) => v.validation_score < 0.7).length;
    if (lowScoreCount > 0) {
      recommendations.push(
        `${lowScoreCount} insights have low validation scores. Review data quality.`
      );
    }

    const issuesCount = validatedInsights.filter((v) => v.issues && v.issues.length > 0).length;
    if (issuesCount > 0) {
      recommendations.push(
        `${issuesCount} insights have validation issues. Consider improving data collection.`
      );
    }

    return recommendations;
  }
}

export const validatorAgent = new ValidatorAgent();
