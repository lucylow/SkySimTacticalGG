// Simulation Agent - Runs "what if" scenario simulations
import { BaseAgent } from './BaseAgent';
import { AgentRole, AgentTask, AgentConfig } from './types';

export interface SimulationResult {
  scenario: Record<string, unknown>;
  simulations_run: number;
  probabilities: Probabilities;
  comparison: Comparison;
  recommendation: string;
  confidence: number;
}

export interface Probabilities {
  win_probability: number;
  loss_probability: number;
  draw_probability: number;
  expected_score: number;
  confidence_interval: [number, number];
  most_likely_outcome: 'win' | 'loss' | 'draw';
}

export interface Comparison {
  actual_outcome: string;
  predicted_outcome: string;
  difference: number;
  improvement_potential: number;
}

class SimulationAgent extends BaseAgent {
  constructor(config?: AgentConfig) {
    super(
      'SimulationAgent',
      AgentRole.SIMULATION_AGENT,
      {
        monte_carlo_simulation: true,
        probability_calculation: true,
        scenario_modeling: true,
      },
      {
        enabled: true,
        default_simulations: 1000,
        max_simulations: 10000,
        confidence_threshold: 0.8,
        ...config,
      }
    );
  }

  processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: SimulationResult;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    this.startProcessing();

    try {
      const { base_state, modification } = task.input_data as {
        base_state?: Record<string, unknown>;
        modification?: Record<string, unknown>;
      };

      if (!base_state || !modification) {
        throw new Error('Missing required input data: base_state and modification');
      }

      // Prepare base scenario
      const baseScenario = this.prepareBaseScenario(base_state);

      // Apply modification
      const modifiedScenario = this.applyModification(baseScenario, modification);

      // Run simulations
      const nSimulations = Math.min(
        this.config.default_simulations || 1000,
        this.config.max_simulations || 10000
      );
      const simulationResults = this.runSimulations(modifiedScenario, nSimulations);

      // Calculate probabilities
      const probabilities = this.calculateProbabilities(simulationResults);

      // Compare with actual
      const comparison = this.compareWithActual(base_state, probabilities);

      const processingTime = this.getProcessingTime();

      return Promise.resolve({
        success: true,
        result: {
          scenario: modification,
          simulations_run: nSimulations,
          probabilities,
          comparison,
          recommendation: this.generateRecommendation(comparison),
          confidence: this.calculateSimulationConfidence(simulationResults),
        },
        processing_time_ms: processingTime,
        task_type: 'simulation',
        accuracy: this.calculateSimulationConfidence(simulationResults),
      });
    } catch (error) {
      const processingTime = this.getProcessingTime();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.log(`Task failed: ${errorMessage}`, 'error');

      return Promise.resolve({
        success: false,
        error: errorMessage,
        processing_time_ms: processingTime,
        task_type: 'simulation',
      });
    }
  }

  private prepareBaseScenario(baseState: Record<string, unknown>): Record<string, unknown> {
    // Prepare base scenario for simulation
    return {
      ...baseState,
      round_state: baseState.round_state || {},
      economy: baseState.economy || {},
      player_positions: baseState.player_positions || [],
    };
  }

  private applyModification(
    baseScenario: Record<string, unknown>,
    modification: Record<string, unknown>
  ): Record<string, unknown> {
    // Apply modification to base scenario
    return {
      ...baseScenario,
      ...modification,
      modified: true,
      modification_timestamp: Date.now(),
    };
  }

  private runSimulations(
    scenario: Record<string, unknown>,
    nSimulations: number
  ): Array<{
    simulation_id: number;
    round_result: string;
    propagated_results: Record<string, unknown>;
    final_outcome: 'win' | 'loss' | 'draw';
  }> {
    const simulations = [];

    // Run Monte Carlo simulations
    for (let i = 0; i < nSimulations; i++) {
      // Clone scenario for this simulation
      const simScenario = JSON.parse(JSON.stringify(scenario)) as Record<string, unknown>;

      // Add stochastic elements
      const stochasticScenario = this.addStochasticElements(simScenario);

      // Simulate round
      const roundResult = this.simulateRound(stochasticScenario);

      // Propagate effects
      const propagatedResults = this.propagateEffects(roundResult, stochasticScenario);

      // Calculate final outcome
      const finalOutcome = this.calculateFinalOutcome(propagatedResults);

      simulations.push({
        simulation_id: i,
        round_result: roundResult,
        propagated_results: propagatedResults,
        final_outcome: finalOutcome,
      });
    }

    return simulations;
  }

  private addStochasticElements(scenario: Record<string, unknown>): Record<string, unknown> {
    // Add random variations to scenario
    return {
      ...scenario,
      random_factor: Math.random(),
      player_skill_variance: (Math.random() - 0.5) * 0.2, // ±10% variance
      timing_variance: (Math.random() - 0.5) * 2, // ±1 second variance
    };
  }

  private simulateRound(scenario: Record<string, unknown>): string {
    // Simplified round simulation
    // In real implementation, would use game mechanics and probabilities
    const baseWinRate = (scenario.win_rate as number) || 0.5;
    const modification = (scenario.modification as Record<string, unknown>) || {};

    // Apply modification effects
    let adjustedWinRate = baseWinRate;
    if (modification.player_improvement) {
      adjustedWinRate += 0.1;
    }
    if (modification.strategy_change) {
      adjustedWinRate += 0.05;
    }

    // Add stochastic element
    adjustedWinRate += (Math.random() - 0.5) * 0.1;
    adjustedWinRate = Math.max(0, Math.min(1, adjustedWinRate));

    return adjustedWinRate > 0.5 ? 'win' : 'loss';
  }

  private propagateEffects(
    roundResult: string,
    scenario: Record<string, unknown>
  ): Record<string, unknown> {
    // Propagate round result effects (economy, momentum, etc.)
    return {
      round_result: roundResult,
      economy_impact: roundResult === 'win' ? 3000 : 1900,
      momentum_shift: roundResult === 'win' ? 0.1 : -0.1,
      next_round_state: {
        ...scenario,
        previous_result: roundResult,
      },
    };
  }

  private calculateFinalOutcome(
    propagatedResults: Record<string, unknown>
  ): 'win' | 'loss' | 'draw' {
    // Calculate final outcome based on propagated results
    const roundResult = propagatedResults.round_result as string;
    return roundResult === 'win' ? 'win' : 'loss';
  }

  private calculateProbabilities(
    simulations: Array<{ final_outcome: 'win' | 'loss' | 'draw' }>
  ): Probabilities {
    const outcomes = simulations.map((s) => s.final_outcome);
    const total = outcomes.length;

    const winCount = outcomes.filter((o) => o === 'win').length;
    const lossCount = outcomes.filter((o) => o === 'loss').length;
    const drawCount = outcomes.filter((o) => o === 'draw').length;

    const winProb = winCount / total;
    const lossProb = lossCount / total;
    const drawProb = drawCount / total;

    // Calculate expected score (simplified)
    const expectedScore = winProb * 1 + drawProb * 0.5;

    // Calculate confidence interval (simplified)
    const stdDev = Math.sqrt((winProb * (1 - winProb)) / total);
    const confidenceInterval: [number, number] = [
      Math.max(0, winProb - 1.96 * stdDev),
      Math.min(1, winProb + 1.96 * stdDev),
    ];

    // Most likely outcome
    const counts = { win: winCount, loss: lossCount, draw: drawCount };
    const mostLikely = Object.entries(counts).reduce((a, b) =>
      counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b
    )[0] as 'win' | 'loss' | 'draw';

    return {
      win_probability: winProb,
      loss_probability: lossProb,
      draw_probability: drawProb,
      expected_score: expectedScore,
      confidence_interval: confidenceInterval,
      most_likely_outcome: mostLikely,
    };
  }

  private compareWithActual(
    baseState: Record<string, unknown>,
    probabilities: Probabilities
  ): Comparison {
    const actualOutcome = (baseState.actual_outcome as string) || 'unknown';
    const predictedOutcome = probabilities.most_likely_outcome;

    // Calculate difference
    const actualWinRate = actualOutcome === 'win' ? 1 : actualOutcome === 'loss' ? 0 : 0.5;
    const difference = Math.abs(probabilities.win_probability - actualWinRate);

    // Improvement potential
    const improvementPotential = probabilities.win_probability - actualWinRate;

    return {
      actual_outcome: actualOutcome,
      predicted_outcome: predictedOutcome,
      difference,
      improvement_potential: improvementPotential,
    };
  }

  private generateRecommendation(comparison: Comparison): string {
    if (comparison.improvement_potential > 0.2) {
      return `Modification shows strong potential (${Math.round(comparison.improvement_potential * 100)}% improvement). Consider implementing this change.`;
    } else if (comparison.improvement_potential > 0) {
      return `Modification shows moderate potential. Test in practice before implementing.`;
    } else {
      return `Modification may not provide significant improvement. Consider alternative strategies.`;
    }
  }

  private calculateSimulationConfidence(
    simulations: Array<{ final_outcome: 'win' | 'loss' | 'draw' }>
  ): number {
    // Confidence increases with more simulations and consistent results
    const n = simulations.length;
    const outcomes = simulations.map((s) => s.final_outcome);

    const winRate = outcomes.filter((o) => o === 'win').length / n;
    const variance = winRate * (1 - winRate);

    // More simulations = higher confidence
    const sampleConfidence = Math.min(n / (this.config.default_simulations || 1000), 1);

    // Lower variance = higher confidence (more consistent results)
    const varianceConfidence = 1 - variance * 2;

    return Math.max(0, Math.min(1, sampleConfidence * 0.6 + varianceConfidence * 0.4));
  }
}

export const simulationAgent = new SimulationAgent();
