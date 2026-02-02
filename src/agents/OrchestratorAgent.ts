// Orchestrator Agent - Coordinates all specialized agents and manages workflows
import { BaseAgent } from './BaseAgent';
import {
  AgentRole,
  AgentTask,
  AgentConfig,
  AgentRequest,
  RequestType,
  WorkflowType,
} from './types';
import { dataFetcherAgent } from './DataFetcherAgent';
import { microPatternDetectorAgent } from './MicroPatternDetectorAgent';
import { strategicAnalyzerAgent } from './StrategicAnalyzerAgent';
import { simulationAgent } from './SimulationAgent';
import { formatterAgent } from './FormatterAgent';
import { validatorAgent } from './ValidatorAgent';

class OrchestratorAgent extends BaseAgent {
  private agentRegistry: Map<AgentRole, BaseAgent>;
  private activeTasks: Map<string, AgentTask>;

  constructor(config?: AgentConfig) {
    super(
      'Orchestrator',
      AgentRole.ORCHESTRATOR,
      {
        task_decomposition: true,
        agent_coordination: true,
        priority_management: true,
      },
      {
        enabled: true,
        max_concurrent_tasks: 10,
        timeout_seconds: 30,
        ...config,
      }
    );

    // Register all agents
    this.agentRegistry = new Map();
    this.agentRegistry.set(AgentRole.DATA_FETCHER, dataFetcherAgent);
    this.agentRegistry.set(AgentRole.MICRO_ANALYZER, microPatternDetectorAgent);
    this.agentRegistry.set(AgentRole.STRATEGIC_ANALYZER, strategicAnalyzerAgent);
    this.agentRegistry.set(AgentRole.SIMULATION_AGENT, simulationAgent);
    this.agentRegistry.set(AgentRole.FORMATTER, formatterAgent);
    this.agentRegistry.set(AgentRole.VALIDATOR, validatorAgent);

    this.activeTasks = new Map();
  }

  async processRequest(request: AgentRequest): Promise<{
    request_id: string;
    workflow_type: WorkflowType;
    agents_used: number;
    processing_time_ms: number;
    results: unknown;
  }> {
    this.startProcessing();

    try {
      // Step 1: Classify request type
      const requestType = this.classifyRequest(request);

      // Step 2: Select workflow based on request type
      const workflow = this.selectWorkflow(requestType);

      // Step 3: Decompose into agent tasks
      const tasks = this.decomposeIntoTasks(workflow, request);

      // Step 4: Execute tasks with dependencies
      const results = await this.executeWorkflow(tasks);

      // Step 5: Synthesize final response
      const finalResponse = await this.synthesizeResults(results, request);

      const processingTime = this.getProcessingTime();

      return {
        request_id: request.id,
        workflow_type: workflow,
        agents_used: results.size,
        processing_time_ms: processingTime,
        results: finalResponse,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Request processing failed: ${errorMessage}`, 'error');
      throw error;
    }
  }

  processTask(_task: AgentTask): Promise<{
    success: boolean;
    result?: unknown;
    error?: string;
    processing_time_ms: number;
    task_type?: string;
    accuracy?: number;
  }> {
    // Orchestrator processes requests, not individual tasks
    throw new Error('Orchestrator processes requests, not tasks. Use processRequest() instead.');
  }

  private classifyRequest(request: AgentRequest): RequestType {
    if (request.type === RequestType.INSIGHTS) return RequestType.INSIGHTS;
    if (request.type === RequestType.REVIEW) return RequestType.REVIEW;
    if (request.type === RequestType.PREDICTION) return RequestType.PREDICTION;

    // Default classification based on request content
    if (request.player_id && request.match_ids) {
      return RequestType.INSIGHTS;
    }
    if (request.modification) {
      return RequestType.PREDICTION;
    }
    return RequestType.REVIEW;
  }

  private selectWorkflow(requestType: RequestType): WorkflowType {
    switch (requestType) {
      case RequestType.INSIGHTS:
        return WorkflowType.PERSONALIZED_INSIGHTS;
      case RequestType.REVIEW:
        return WorkflowType.MACRO_REVIEW;
      case RequestType.PREDICTION:
        return WorkflowType.HYPOTHETICAL_PREDICTIONS;
      default:
        return WorkflowType.PERSONALIZED_INSIGHTS;
    }
  }

  private decomposeIntoTasks(workflow: WorkflowType, request: AgentRequest): AgentTask[] {
    const tasks: AgentTask[] = [];
    const now = Date.now();

    if (workflow === WorkflowType.PERSONALIZED_INSIGHTS) {
      // Task 1: Data Fetching
      tasks.push({
        id: `task-${now}-1`,
        agent_role: AgentRole.DATA_FETCHER,
        task_description: 'Fetch player match data and telemetry',
        input_data: {
          player_id: request.player_id,
          match_ids: request.match_ids,
          data_types: ['telemetry', 'events', 'economy', 'positions'],
        },
        expected_output: 'Structured player performance data',
        priority: 1,
        dependencies: [],
        created_at: now,
        status: 'pending',
      });

      // Task 2: Micro Pattern Analysis
      tasks.push({
        id: `task-${now}-2`,
        agent_role: AgentRole.MICRO_ANALYZER,
        task_description: 'Analyze micro-patterns and mistakes',
        input_data: {},
        expected_output: 'List of detected patterns with statistical significance',
        priority: 2,
        dependencies: [AgentRole.DATA_FETCHER],
        created_at: now,
        status: 'pending',
      });

      // Task 3: Strategic Correlation
      tasks.push({
        id: `task-${now}-3`,
        agent_role: AgentRole.STRATEGIC_ANALYZER,
        task_description: 'Correlate micro-mistakes with macro outcomes',
        input_data: {},
        expected_output: 'Insights linking individual errors to team results',
        priority: 3,
        dependencies: [AgentRole.MICRO_ANALYZER],
        created_at: now,
        status: 'pending',
      });

      // Task 4: Formatting
      tasks.push({
        id: `task-${now}-4`,
        agent_role: AgentRole.FORMATTER,
        task_description: 'Format insights into coach-friendly output',
        input_data: {},
        expected_output: 'Formatted insights with recommendations',
        priority: 4,
        dependencies: [AgentRole.STRATEGIC_ANALYZER],
        created_at: now,
        status: 'pending',
      });

      // Task 5: Validation
      tasks.push({
        id: `task-${now}-5`,
        agent_role: AgentRole.VALIDATOR,
        task_description: 'Validate insights for accuracy',
        input_data: {},
        expected_output: 'Validated insights with confidence scores',
        priority: 5,
        dependencies: [AgentRole.FORMATTER],
        created_at: now,
        status: 'pending',
      });
    } else if (workflow === WorkflowType.HYPOTHETICAL_PREDICTIONS) {
      // Task 1: Data Fetching
      tasks.push({
        id: `task-${now}-1`,
        agent_role: AgentRole.DATA_FETCHER,
        task_description: 'Fetch base state data',
        input_data: {
          match_ids: request.match_ids,
        },
        expected_output: 'Base state data for simulation',
        priority: 1,
        dependencies: [],
        created_at: now,
        status: 'pending',
      });

      // Task 2: Simulation
      tasks.push({
        id: `task-${now}-2`,
        agent_role: AgentRole.SIMULATION_AGENT,
        task_description: 'Run hypothetical scenario simulation',
        input_data: {
          base_state: request.base_state,
          modification: request.modification,
        },
        expected_output: 'Simulation results with probabilities',
        priority: 2,
        dependencies: [AgentRole.DATA_FETCHER],
        created_at: now,
        status: 'pending',
      });
    }

    return tasks;
  }

  private async executeWorkflow(tasks: AgentTask[]): Promise<Map<AgentRole, unknown>> {
    const results = new Map<AgentRole, unknown>();
    const executedTasks = new Set<AgentRole>();
    const remainingTasks = [...tasks];

    while (remainingTasks.length > 0) {
      // Find tasks whose dependencies are satisfied
      const executableTasks = remainingTasks.filter((task) =>
        task.dependencies.every((dep) => executedTasks.has(dep))
      );

      if (executableTasks.length === 0) {
        this.log('Deadlock in task dependencies', 'error');
        break;
      }

      // Execute tasks in parallel
      const executionPromises = executableTasks.map(async (task) => {
        const agent = this.agentRegistry.get(task.agent_role);
        if (!agent) {
          throw new Error(`Agent ${task.agent_role} not found`);
        }

        // Populate input data from previous results
        if (task.dependencies.length > 0) {
          task.input_data = this.populateInputData(task, results);
        }

        task.status = 'in_progress';
        this.activeTasks.set(task.id, task);

        try {
          const result = await agent.processTask(task);

          if (result.success && result.result) {
            results.set(task.agent_role, result.result);
            task.result = result.result;
            task.status = 'completed';
            executedTasks.add(task.agent_role);
          } else {
            task.status = 'failed';
            task.error = result.error;
            throw new Error(result.error || 'Task failed');
          }
        } catch (error) {
          task.status = 'failed';
          task.error = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        } finally {
          this.activeTasks.delete(task.id);
        }
      });

      await Promise.all(executionPromises);

      // Remove executed tasks
      remainingTasks.splice(
        0,
        remainingTasks.length,
        ...remainingTasks.filter((task) => !executedTasks.has(task.agent_role))
      );
    }

    return results;
  }

  private populateInputData(
    task: AgentTask,
    results: Map<AgentRole, unknown>
  ): Record<string, unknown> {
    const inputData: Record<string, unknown> = { ...task.input_data };

    // Populate from dependency results
    if (task.agent_role === AgentRole.MICRO_ANALYZER) {
      const dataFetcherResult = results.get(AgentRole.DATA_FETCHER);
      if (dataFetcherResult) {
        inputData.match_data = dataFetcherResult;
        inputData.player_data = (dataFetcherResult as { player?: unknown }).player;
      }
    } else if (task.agent_role === AgentRole.STRATEGIC_ANALYZER) {
      const microResult = results.get(AgentRole.MICRO_ANALYZER);
      const dataFetcherResult = results.get(AgentRole.DATA_FETCHER);
      if (microResult) {
        inputData.micro_patterns = microResult;
      }
      if (dataFetcherResult) {
        inputData.match_data = dataFetcherResult;
      }
    } else if (task.agent_role === AgentRole.FORMATTER) {
      const microResult = results.get(AgentRole.MICRO_ANALYZER);
      const strategicResult = results.get(AgentRole.STRATEGIC_ANALYZER);
      const dataFetcherResult = results.get(AgentRole.DATA_FETCHER);
      if (microResult) {
        inputData.patterns = microResult;
      }
      if (strategicResult) {
        inputData.correlations = strategicResult;
      }
      if (dataFetcherResult) {
        inputData.player_data = (dataFetcherResult as { player?: unknown }).player;
      }
    } else if (task.agent_role === AgentRole.VALIDATOR) {
      const formatterResult = results.get(AgentRole.FORMATTER);
      const dataFetcherResult = results.get(AgentRole.DATA_FETCHER);
      if (formatterResult) {
        inputData.insights = formatterResult;
      }
      if (dataFetcherResult) {
        inputData.raw_data = dataFetcherResult;
      }
    }

    return inputData;
  }

  private synthesizeResults(results: Map<AgentRole, unknown>, request: AgentRequest): unknown {
    // Synthesize results from all agents into final response
    const synthesized: { 
      request_id: string; 
      workflow_type: WorkflowType; 
      results: Record<string, unknown>;
      insights?: unknown;
      confidence?: number;
    } = {
      request_id: request.id,
      workflow_type: this.selectWorkflow(this.classifyRequest(request)),
      results: {},
    };

    // Combine all results
    for (const [role, result] of results.entries()) {
      synthesized.results[role] = result;
    }

    // Extract final insights if available
    const validatorResult = results.get(AgentRole.VALIDATOR) as
      | {
          critical_insights?: unknown[];
          confidence?: number;
        }
      | undefined;

    if (validatorResult) {
      synthesized.insights = validatorResult.critical_insights;
      synthesized.confidence = validatorResult.confidence;
    }

    return synthesized;
  }

  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agentRegistry.get(role);
  }

  getActiveTasks(): AgentTask[] {
    return Array.from(this.activeTasks.values());
  }
}

export const orchestratorAgent = new OrchestratorAgent();
