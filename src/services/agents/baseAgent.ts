// Base Agent Class
// Provides foundation for all specialized agents in the multi-agent system

import type {
  BaseAgent,
  AgentRole,
  AgentInput,
  AgentOutput,
  AgentTool,
  AgentLLMConfig,
} from '@/types/agents';

/**
 * Abstract base class for all AI agents
 * Provides common functionality for reasoning, tool use, and memory
 */
export abstract class BaseAgentImpl implements BaseAgent {
  abstract name: string;
  abstract role: AgentRole;
  abstract description: string;

  protected llmConfig: AgentLLMConfig;
  protected memory: Map<string, unknown> = new Map();

  constructor(llmConfig?: Partial<AgentLLMConfig>) {
    this.llmConfig = {
      provider: llmConfig?.provider || 'openai',
      model: llmConfig?.model || 'gpt-4o-mini',
      temperature: llmConfig?.temperature ?? 0.7,
      max_tokens: llmConfig?.max_tokens ?? 2000,
      api_key: llmConfig?.api_key,
    };
  }

  /**
   * Main execution method - must be implemented by each agent
   */
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  /**
   * Get tools available to this agent
   */
  abstract getTools(): AgentTool[];

  /**
   * Call LLM for reasoning and decision-making
   * In production, this would call OpenAI/Anthropic/etc APIs
   */
  protected async callLLM(
    prompt: string,
    systemMessage?: string
  ): Promise<string> {
    // Mock LLM call for now - in production, replace with actual API call
    // Example: OpenAI API call
    /*
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.llmConfig.api_key}`,
      },
      body: JSON.stringify({
        model: this.llmConfig.model,
        messages: [
          { role: 'system', content: systemMessage || this.description },
          { role: 'user', content: prompt },
        ],
        temperature: this.llmConfig.temperature,
        max_tokens: this.llmConfig.max_tokens,
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
    */

    // Mock implementation for development
    await this.delay(100 + Math.random() * 200);
    return this.generateMockResponse(prompt, systemMessage);
  }

  /**
   * Generate mock LLM response (for development/testing)
   */
  private generateMockResponse(prompt: string, systemMessage?: string): string {
    // Simple heuristic-based response generation
    const lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt.includes('mistake') || lowerPrompt.includes('error')) {
      return 'I detected a predictable peek pattern that occurred 3 times in the last 5 rounds. This mistake has a 0.65 correlation with round losses. Recommend varying positioning and using off-angles.';
    }

    if (lowerPrompt.includes('strategy') || lowerPrompt.includes('tactical')) {
      return 'Analysis shows team loses 70% of rounds when Entry Fragger dies early on Map A. Suggested adjustment: implement a double-entry protocol or delay initial contact by 3-5 seconds.';
    }

    if (lowerPrompt.includes('opponent') || lowerPrompt.includes('scout')) {
      return 'Opponent team prefers aggressive A-site executes on Bind (85% frequency). They struggle with retake scenarios (45% success rate). Recommended counter: stack utility on A-site and prepare quick rotate protocols.';
    }

    if (lowerPrompt.includes('simulation') || lowerPrompt.includes('predict')) {
      return 'Running 10,000 simulations: Drafting Jett + Omen on Ascent yields 68% win probability against this opponent. Alternative composition (Raze + Brimstone) shows 62% win probability.';
    }

    if (lowerPrompt.includes('real-time') || lowerPrompt.includes('live')) {
      return 'Live analysis: Opponent sniper is low on utility (1 flash remaining). Consider fast push on B-site. Pattern detected: they rotate slowly after losing first contact (avg 8 seconds).';
    }

    return 'Analysis complete. Generated insights based on provided data.';
  }

  /**
   * Execute a tool
   */
  protected async executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const tools = this.getTools();
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    return await tool.execute(args);
  }

  /**
   * Store information in agent memory
   */
  protected storeMemory(key: string, value: unknown): void {
    this.memory.set(key, value);
  }

  /**
   * Retrieve information from agent memory
   */
  protected getMemory(key: string): unknown | undefined {
    return this.memory.get(key);
  }

  /**
   * Clear agent memory
   */
  protected clearMemory(): void {
    this.memory.clear();
  }

  /**
   * Utility: Delay function
   */
  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Create base output structure
   */
  protected createBaseOutput(
    insights: any[],
    recommendations: string[],
    confidence: number = 0.8
  ): AgentOutput {
    return {
      agent_name: this.name,
      agent_role: this.role,
      timestamp: Date.now(),
      insights,
      recommendations,
      confidence,
    };
  }
}


