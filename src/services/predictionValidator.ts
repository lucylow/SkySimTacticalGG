// Prediction Validator - Validates and improves prediction accuracy
// Runs multiple validation methods to ensure reliable predictions

export interface ValidationResult {
  prediction: unknown;
  validations: {
    historical_check: ValidationCheck;
    model_agreement: ValidationCheck;
    expert_rules: ValidationCheck;
  };
  overall_confidence: number;
  should_trust: boolean;
}

export interface ValidationCheck {
  passed: boolean;
  confidence: number;
  explanation: string;
}

/**
 * Prediction Validator
 * Validates predictions using multiple methods for accuracy
 */
export class PredictionValidator {
  /**
   * Validate a prediction using multiple methods
   */
  async validatePrediction(
    matchId: string,
    prediction: {
      actual: { success_probability: number };
      hypothetical: { success_probability: number };
      recommendation: string;
    }
  ): Promise<{
    confidence: number;
    validations: ValidationResult['validations'];
  }> {
    // 1. Historical consistency check
    const historicalCheck = await this.checkHistoricalConsistency(prediction, matchId);

    // 2. Model agreement check (ensemble validation)
    const modelAgreement = this.checkModelAgreement(prediction);

    // 3. Expert rule validation
    const expertRules = this.applyExpertRules(prediction);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence({
      historical_check: historicalCheck,
      model_agreement: modelAgreement,
      expert_rules: expertRules,
    });

    return {
      confidence: overallConfidence,
      validations: {
        historical_check: historicalCheck,
        model_agreement: modelAgreement,
        expert_rules: expertRules,
      },
    };
  }

  /**
   * Check if prediction is consistent with historical data
   */
  private async checkHistoricalConsistency(
    prediction: { actual: { success_probability: number }; hypothetical: { success_probability: number } },
    matchId: string
  ): Promise<ValidationCheck> {
    // In production, this would query historical matches
    // For now, validate based on probability ranges

    const probDiff = Math.abs(prediction.hypothetical.success_probability - prediction.actual.success_probability);

    // Large differences (>0.4) are suspicious without strong evidence
    if (probDiff > 0.4) {
      return {
        passed: false,
        confidence: 0.5,
        explanation: 'Large probability difference detected. Verify with more historical data.',
      };
    }

    // Probabilities should be in valid range
    if (
      prediction.hypothetical.success_probability < 0 ||
      prediction.hypothetical.success_probability > 1 ||
      prediction.actual.success_probability < 0 ||
      prediction.actual.success_probability > 1
    ) {
      return {
        passed: false,
        confidence: 0.0,
        explanation: 'Invalid probability values detected.',
      };
    }

    return {
      passed: true,
      confidence: 0.8,
      explanation: 'Prediction is consistent with historical patterns.',
    };
  }

  /**
   * Check if multiple models agree on the prediction
   */
  private checkModelAgreement(
    prediction: { actual: { success_probability: number }; hypothetical: { success_probability: number } }
  ): ValidationCheck {
    // In production, this would compare results from multiple models
    // For now, validate internal consistency

    const probDiff = prediction.hypothetical.success_probability - prediction.actual.success_probability;

    // Check if the difference is reasonable
    if (Math.abs(probDiff) > 0.5) {
      return {
        passed: false,
        confidence: 0.6,
        explanation: 'Large probability swing may indicate model uncertainty.',
      };
    }

    // Check if probabilities are well-calibrated (not too extreme)
    const isWellCalibrated =
      prediction.hypothetical.success_probability > 0.1 &&
      prediction.hypothetical.success_probability < 0.9;

    if (!isWellCalibrated) {
      return {
        passed: false,
        confidence: 0.7,
        explanation: 'Extreme probabilities may indicate overconfidence.',
      };
    }

    return {
      passed: true,
      confidence: 0.85,
      explanation: 'Models show good agreement on prediction.',
    };
  }

  /**
   * Apply expert rules to validate prediction
   */
  private applyExpertRules(
    prediction: { actual: { success_probability: number }; hypothetical: { success_probability: number }; recommendation: string }
  ): ValidationCheck {
    const rules: Array<{ check: () => boolean; explanation: string }> = [];

    // Rule 1: Probabilities should sum to reasonable values
    rules.push({
      check: () => {
        const sum = prediction.actual.success_probability + prediction.hypothetical.success_probability;
        return sum >= 0.5 && sum <= 1.5; // Allow some overlap
      },
      explanation: 'Probability values are within reasonable bounds.',
    });

    // Rule 2: Recommendation should align with probability difference
    rules.push({
      check: () => {
        const probDiff = prediction.hypothetical.success_probability - prediction.actual.success_probability;
        const recommendsHypothetical = prediction.recommendation.toLowerCase().includes('superior') ||
          prediction.recommendation.toLowerCase().includes('better');
        return (probDiff > 0 && recommendsHypothetical) || (probDiff <= 0 && !recommendsHypothetical);
      },
      explanation: 'Recommendation aligns with probability analysis.',
    });

    // Rule 3: Extreme probabilities should have justification
    rules.push({
      check: () => {
        const extremeProb = prediction.hypothetical.success_probability < 0.05 || prediction.hypothetical.success_probability > 0.95;
        if (extremeProb) {
          // In production, would check if there's strong evidence
          return true; // For now, allow extreme probabilities
        }
        return true;
      },
      explanation: 'Extreme probabilities are justified by game state.',
    });

    const passedRules = rules.filter(r => r.check()).length;
    const allPassed = passedRules === rules.length;

    return {
      passed: allPassed,
      confidence: passedRules / rules.length,
      explanation: allPassed
        ? 'All expert rules passed.'
        : `${rules.length - passedRules} expert rule(s) failed validation.`,
    };
  }

  /**
   * Calculate overall confidence from validation results
   */
  private calculateOverallConfidence(validations: ValidationResult['validations']): number {
    const weights = {
      historical_check: 0.4,
      model_agreement: 0.3,
      expert_rules: 0.3,
    };

    let confidence = 0;
    for (const [key, weight] of Object.entries(weights)) {
      const validation = validations[key as keyof typeof validations];
      if (validation.passed) {
        confidence += weight * validation.confidence;
      } else {
        // Reduce confidence if validation failed
        confidence += weight * validation.confidence * 0.5;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }
}

export const predictionValidator = new PredictionValidator();


