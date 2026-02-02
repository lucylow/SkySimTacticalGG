// Base Agent Class
import type { AgentRole, AgentCapabilities, AgentConfig, AgentTask } from './types';

export abstract class BaseAgent {
  protected name: string;
  protected role: AgentRole;
  protected capabilities: AgentCapabilities;
  protected config: AgentConfig;
  protected processingStartTime?: number;

  constructor(
    name: string,
    role: AgentRole,
    capabilities: AgentCapabilities,
    config: AgentConfig = { enabled: true }
  ) {
    this.name = name;
    this.role = role;
    this.capabilities = capabilities;
    this.config = config;
  }

  /**
   * Process a task assigned to this agent
   */
  abstract processTask(task: AgentTask): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }>;

  /**
   * Get agent metadata
   */
  getMetadata(): {
    name: string;
    role: AgentRole;
    capabilities: AgentCapabilities;
    config: AgentConfig;
  } {
    return {
      name: this.name,
      role: this.role,
      capabilities: this.capabilities,
      config: this.config,
    };
  }

  /**
   * Start processing timer
   */
  protected startProcessing(): void {
    this.processingStartTime = Date.now();
  }

  /**
   * Get processing time in milliseconds
   */
  protected getProcessingTime(): number {
    if (!this.processingStartTime) return 0;
    return Date.now() - this.processingStartTime;
  }

  /**
   * Check if agent is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled ?? true;
  }

  /**
   * Log agent activity (can be overridden for custom logging)
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
      console.error(logMessage);
    } else if (level === 'warn') {
      console.warn(logMessage);
    } else {
      console.warn(logMessage);
    }
  }
}
