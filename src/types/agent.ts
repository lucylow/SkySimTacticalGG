// AI Agent Types

export type TokenEvent = { type: 'token'; data: { text: string } };
export type ToolEvent = { type: 'tool'; data: { tool: string; args?: Record<string, unknown> } };
export type ToolResultEvent = { type: 'tool_result'; data: { tool: string; result: unknown } };
export type MetaEvent = { type: 'meta'; data: Record<string, unknown> };
export type TimelineEvent = { type: 'timeline'; data: { id: number | string; title: string; detail?: string } };
export type DoneEvent = { type: 'done'; data: { summary: string } };

export type AgentEvent = TokenEvent | ToolEvent | ToolResultEvent | MetaEvent | TimelineEvent | DoneEvent;

export type AgentMessage = {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  text: string;
  timestamp: number;
};

export type MemoryItem = {
  id: string;
  text: string;
};

export type TimelineItem = {
  id: string | number;
  title: string;
  detail?: string;
  timestamp: number;
};

export type AgentTool = {
  name: string;
  description: string;
  icon: string;
};
