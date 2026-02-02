// Agent Performance Monitoring
import { AgentRole } from './types';
import type { AgentStatus, AgentError } from './types';

export interface AgentMetrics {
  tasks_processed: number;
  success_rate: number;
  average_processing_time: number;
  errors: AgentError[];
  last_active?: Date;
  specialty_accuracy: Record<string, { total: number; correct: number }>;
}

export interface AgentHealthReport {
  total_agents: number;
  healthy_agents: number;
  unhealthy_agents: string[];
  overall_success_rate: number;
  agent_details: Record<string, AgentStatus>;
}

export class AgentMonitor {
  private agentMetrics: Map<string, AgentMetrics>;

  constructor() {
    this.agentMetrics = new Map();
  }

  /**
   * Track performance metrics for an agent
   */
  trackAgentPerformance(agentName: string, taskResult: {
    success: boolean;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }): void {
    let metrics = this.agentMetrics.get(agentName);
    
    if (!metrics) {
      metrics = {
        tasks_processed: 0,
        success_rate: 0,
        average_processing_time: 0,
        errors: [],
        specialty_accuracy: {},
      };
      this.agentMetrics.set(agentName, metrics);
    }

    metrics.tasks_processed += 1;
    metrics.last_active = new Date();

    if (taskResult.success) {
      // Update success rate
      const currentSuccess = metrics.success_rate * (metrics.tasks_processed - 1);
      metrics.success_rate = (currentSuccess + 1) / metrics.tasks_processed;

      // Update processing time
      const processingTime = taskResult.processing_time_ms;
      const currentAvg = metrics.average_processing_time;
      metrics.average_processing_time =
        (currentAvg * (metrics.tasks_processed - 1) + processingTime) /
        metrics.tasks_processed;

      // Update specialty accuracy
      const taskType = taskResult.task_type || 'unknown';
      if (!metrics.specialty_accuracy[taskType]) {
        metrics.specialty_accuracy[taskType] = { total: 0, correct: 0 };
      }

      const specialty = metrics.specialty_accuracy[taskType];
      specialty.total += 1;
      if ((taskResult.accuracy || 0) > 0.7) {
        specialty.correct += 1;
      }
    } else {
      metrics.errors.push({
        timestamp: new Date().toISOString(),
        error: 'Task failed',
        task_type: taskResult.task_type,
      });
    }
  }

  /**
   * Generate health report for all agents
   */
  getAgentHealthReport(): AgentHealthReport {
    const report: AgentHealthReport = {
      total_agents: this.agentMetrics.size,
      healthy_agents: 0,
      unhealthy_agents: [],
      overall_success_rate: 0,
      agent_details: {},
    };

    for (const [agentName, metrics] of this.agentMetrics.entries()) {
      // Determine health
      const isHealthy =
        metrics.success_rate > 0.8 &&
        metrics.errors.length < 5 &&
        (!metrics.last_active ||
          (Date.now() - metrics.last_active.getTime()) / 1000 < 300);

      if (isHealthy) {
        report.healthy_agents += 1;
      } else {
        report.unhealthy_agents.push(agentName);
      }

      const specialties: Record<string, number> = {};
      for (const [specialty, data] of Object.entries(metrics.specialty_accuracy)) {
        specialties[specialty] = data.total > 0 ? data.correct / data.total : 0;
      }

      report.agent_details[agentName] = {
        name: agentName,
        role: this.getAgentRole(agentName),
        healthy: isHealthy,
        tasks_processed: metrics.tasks_processed,
        success_rate: metrics.success_rate,
        avg_processing_time_ms: metrics.average_processing_time,
        recent_errors: metrics.errors.slice(-5),
        specialties,
        last_active: metrics.last_active?.toISOString(),
        capabilities: {}, // Would be populated from agent metadata
      };
    }

    // Calculate overall success rate
    if (report.total_agents > 0) {
      const totalSuccess = Object.values(report.agent_details).reduce(
        (sum, details) => sum + details.success_rate,
        0
      );
      report.overall_success_rate = totalSuccess / report.total_agents;
    }

    return report;
  }

  /**
   * Get metrics for a specific agent
   */
  getAgentMetrics(agentName: string): AgentMetrics | undefined {
    return this.agentMetrics.get(agentName);
  }

  /**
   * Clear metrics for an agent
   */
  clearAgentMetrics(agentName: string): void {
    this.agentMetrics.delete(agentName);
  }

  /**
   * Clear all metrics
   */
  clearAllMetrics(): void {
    this.agentMetrics.clear();
  }

  private getAgentRole(agentName: string): AgentRole {
    // Map agent names to roles
    const roleMap: Record<string, AgentRole> = {
      Orchestrator: AgentRole.ORCHESTRATOR,
      DataFetcher: AgentRole.DATA_FETCHER,
      MicroPatternDetector: AgentRole.MICRO_ANALYZER,
      StrategicAnalyzer: AgentRole.STRATEGIC_ANALYZER,
      SimulationAgent: AgentRole.SIMULATION_AGENT,
      Formatter: AgentRole.FORMATTER,
      Validator: AgentRole.VALIDATOR,
    };

    return roleMap[agentName] || AgentRole.DATA_FETCHER;
  }
}

// Global monitor instance
export const agentMonitor = new AgentMonitor();
