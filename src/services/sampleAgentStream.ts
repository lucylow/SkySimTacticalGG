// Mock Agent Stream - Simulates SSE streaming responses
import type { AgentEvent } from '@/types/agent';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export function simulateAgentStream(
  prompt: string,
  onEvent: (event: AgentEvent) => void
): { cancel: () => void } {
  let cancelled = false;

  const run = async () => {
    // Meta event
    onEvent({ type: 'meta', data: { model: 'mock-agent-v1', prompt } });

    // Analyze prompt for context
    const isAnalysis = prompt.toLowerCase().includes('analy');
    const isSearch = prompt.toLowerCase().includes('search') || prompt.toLowerCase().includes('find');
    const isHelp = prompt.toLowerCase().includes('help') || prompt.toLowerCase().includes('improve');

    // Initial response tokens
    const introTokens = [
      "I'll ",
      "help you ",
      "with that. ",
      "Let me ",
      "process ",
      "your request..."
    ];

    for (const token of introTokens) {
      if (cancelled) return;
      await wait(80);
      onEvent({ type: 'token', data: { text: token } });
    }

    // Simulate tool calls based on prompt content
    if (isSearch || isAnalysis) {
      if (cancelled) return;
      await wait(300);
      onEvent({ type: 'tool', data: { tool: 'search_database', args: { query: prompt.slice(0, 50) } } });
      
      await wait(800);
      onEvent({ 
        type: 'tool_result', 
        data: { 
          tool: 'search_database', 
          result: { 
            found: 12, 
            topResults: ['Player Stats Analysis', 'Match Performance Data', 'Team Metrics'] 
          } 
        } 
      });

      const searchTokens = [
        "\n\n",
        "Based on ",
        "my search, ",
        "I found ",
        "**12 relevant results**. ",
        "The top matches include:\n",
        "- Player Stats Analysis\n",
        "- Match Performance Data\n",
        "- Team Metrics\n"
      ];

      for (const token of searchTokens) {
        if (cancelled) return;
        await wait(60);
        onEvent({ type: 'token', data: { text: token } });
      }
    }

    if (isAnalysis) {
      if (cancelled) return;
      await wait(300);
      onEvent({ type: 'tool', data: { tool: 'analyze_patterns', args: { depth: 'deep' } } });
      
      await wait(1000);
      onEvent({ 
        type: 'tool_result', 
        data: { 
          tool: 'analyze_patterns', 
          result: { 
            patterns: ['Consistent aim improvement', 'Strategic positioning gaps'],
            confidence: 0.87 
          } 
        } 
      });

      onEvent({ 
        type: 'timeline', 
        data: { 
          id: Date.now(), 
          title: 'Pattern Analysis Complete', 
          detail: 'Identified 2 key patterns with 87% confidence' 
        } 
      });
    }

    // Main response based on context
    const mainResponse = isHelp 
      ? [
          "\n\n## Recommendations\n\n",
          "1. **Focus on positioning** - ",
          "Players should work on map control\n",
          "2. **Communication drills** - ",
          "Improve callout timing\n",
          "3. **Review VODs** - ",
          "Analyze recent matches for patterns\n"
        ]
      : [
          "\n\n## Analysis Summary\n\n",
          "I've processed your request. ",
          "Here are the key findings:\n\n",
          "- Performance metrics are **trending upward**\n",
          "- Team coordination has improved by **15%**\n",
          "- Individual player stats show consistency\n"
        ];

    for (const token of mainResponse) {
      if (cancelled) return;
      await wait(70);
      onEvent({ type: 'token', data: { text: token } });
    }

    // Calculate tool usage
    if (cancelled) return;
    await wait(200);
    onEvent({ type: 'tool', data: { tool: 'calculate_metrics', args: { type: 'summary' } } });
    
    await wait(600);
    onEvent({ 
      type: 'tool_result', 
      data: { 
        tool: 'calculate_metrics', 
        result: { avgKD: 1.23, winRate: 0.58, improvement: '+12%' } 
      } 
    });

    const metricsTokens = [
      "\n\n### Quick Stats\n",
      "- Average K/D: **1.23**\n",
      "- Win Rate: **58%**\n",
      "- Overall Improvement: **+12%**\n"
    ];

    for (const token of metricsTokens) {
      if (cancelled) return;
      await wait(50);
      onEvent({ type: 'token', data: { text: token } });
    }

    // Final timeline event
    if (cancelled) return;
    await wait(200);
    onEvent({ 
      type: 'timeline', 
      data: { 
        id: Date.now(), 
        title: 'Response Generated', 
        detail: 'Analysis complete with recommendations' 
      } 
    });

    // Done
    await wait(100);
    onEvent({ type: 'done', data: { summary: 'Analysis complete' } });
  };

  run();

  return {
    cancel: () => { cancelled = true; }
  };
}

// Mock tools available
export const availableTools: { name: string; description: string; icon: string }[] = [
  { name: 'search_database', description: 'Search player and match data', icon: '🔍' },
  { name: 'analyze_patterns', description: 'Deep pattern analysis', icon: '📊' },
  { name: 'calculate_metrics', description: 'Calculate performance metrics', icon: '🧮' },
  { name: 'generate_report', description: 'Generate detailed reports', icon: '📄' },
  { name: 'compare_players', description: 'Compare player statistics', icon: '⚖️' },
];
