// src/Samples/sseReplayEvents.ts - Pre-recorded SSE events for demo streaming
import type { AgentEvent } from '@/types/agent';

let eventCounter = 0;
const genEventId = () => `evt-${++eventCounter}-${Date.now().toString(36)}`;

export const sseReplayEvents: AgentEvent[] = [
  { type: "meta", data: { runId: genEventId(), model: "Sample-llm-0.1", ts: new Date().toISOString() } },

  { type: "token", data: { text: "Sure," } },
  { type: "token", data: { text: " I can analyze the catalog." } },
  { type: "token", data: { text: " First, I'll look for top categories and price anomalies." } },

  { type: "tool", data: { tool: "analyze_catalog", args: { top: 5 } } },

  { type: "token", data: { text: " Running a statistical summary..." } },

  { type: "tool_result", data: { tool: "analyze_catalog", result: { topCategories: ["Electronics", "Home"], avgPrice: 129.12, priceStdDev: 58.2 } } },

  { type: "token", data: { text: "\n\n## Analysis Results\n\n" } },
  { type: "token", data: { text: "Based on the analysis, **Electronics** and **Home** are dominating conversions.\n\n" } },
  { type: "token", data: { text: "### Proposed Actions:\n" } },
  { type: "token", data: { text: "1. Add quick preview functionality\n" } },
  { type: "token", data: { text: "2. Optimize hero microcopy\n" } },
  { type: "token", data: { text: "3. Improve product image quality\n" } },

  { type: "timeline", data: { id: genEventId(), title: "Generated Plan", detail: "Quick preview + microcopy + image improvements" } },

  { type: "token", data: { text: "\n\n### Expected Impact:\n" } },
  { type: "token", data: { text: "- CTR improvement: **+15%**\n" } },
  { type: "token", data: { text: "- Conversion uplift: **+8%**\n" } },
  { type: "token", data: { text: "- User engagement: **+22%**\n" } },

  { type: "done", data: { summary: "Analysis complete with 3 actionable recommendations" } },
];

// Extended replay with more tool interactions
export const extendedReplayEvents: AgentEvent[] = [
  { type: "meta", data: { runId: genEventId(), model: "Sample-agent-v2", ts: new Date().toISOString() } },

  { type: "token", data: { text: "I'll perform a comprehensive analysis of your esports team performance." } },

  { type: "tool", data: { tool: "search_database", args: { query: "recent match statistics" } } },
  { type: "token", data: { text: " Searching match history..." } },
  { type: "tool_result", data: { tool: "search_database", result: { found: 24, matches: ["vs Team Alpha", "vs Team Beta", "vs Team Gamma"] } } },

  { type: "timeline", data: { id: genEventId(), title: "Data Retrieved", detail: "24 recent matches analyzed" } },

  { type: "tool", data: { tool: "analyze_patterns", args: { depth: "deep", timeRange: "30d" } } },
  { type: "token", data: { text: "\n\nAnalyzing patterns across matches..." } },
  { type: "tool_result", data: { tool: "analyze_patterns", result: { patterns: ["Strong early game", "Weak rotations", "Excellent clutch performance"], confidence: 0.91 } } },

  { type: "token", data: { text: "\n\n## Team Performance Report\n\n" } },
  { type: "token", data: { text: "### Strengths:\n" } },
  { type: "token", data: { text: "- **Early game execution** — 78% win rate in first 5 minutes\n" } },
  { type: "token", data: { text: "- **Clutch situations** — 65% success rate in 1v1 scenarios\n\n" } },
  { type: "token", data: { text: "### Areas for Improvement:\n" } },
  { type: "token", data: { text: "- **Mid-game rotations** — 12% below league average\n" } },
  { type: "token", data: { text: "- **Map control** — inconsistent across different maps\n" } },

  { type: "tool", data: { tool: "calculate_metrics", args: { type: "performance_score" } } },
  { type: "tool_result", data: { tool: "calculate_metrics", result: { overallScore: 7.8, ranking: "Top 15%", trend: "+0.4 this month" } } },

  { type: "timeline", data: { id: genEventId(), title: "Metrics Calculated", detail: "Overall score: 7.8/10" } },

  { type: "token", data: { text: "\n\n### Recommendations:\n" } },
  { type: "token", data: { text: "1. Schedule rotation drills 3x weekly\n" } },
  { type: "token", data: { text: "2. VOD review focusing on map control\n" } },
  { type: "token", data: { text: "3. Practice specific callout timing\n" } },

  { type: "done", data: { summary: "Performance analysis complete with training recommendations" } },
];

