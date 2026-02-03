import { BaseAgentImpl } from './baseAgent';
import { AgentInput, AgentOutput, AgentInsight, AgentTool } from '@/types/agents';
import { LoLQueueAnalysisOutput, QueueComparisonData } from '@/types/lolQueueStats';

export class LoLQueueAnalystAgent extends BaseAgentImpl {
  name = 'LoL Queue Strategy Analyst';
  role = 'lol_queue_analyst' as any;
  description = 'Analyzes differences between Solo Queue and Flex/Team play to optimize strategy.';

  async execute(input: AgentInput): Promise<LoLQueueAnalysisOutput> {
    const comparisonData = this.getComparisonData();
    
    const insights: AgentInsight[] = [
      {
        id: 'queue-diff-1',
        type: 'strategy',
        title: 'Queue Dynamics Shift',
        description: `Flex Queue shows a ${comparisonData.metrics.find(m => m.metric === 'Avg Win Rate')?.flex} average win rate for coordinated stacks, favoring macro-heavy playstyles.`,
        severity: 0.7,
        actionable: true,
      },
      {
        id: 'queue-diff-2',
        type: 'tactical',
        title: 'Vision & Objective Priority',
        description: 'Flex games emphasize vision (24-28 wards) and objectives (58% drake) significantly more than Solo Queue.',
        severity: 0.6,
        actionable: true,
      }
    ];

    const recommendations = [
      'In Solo Queue: Focus on individual carry potential and farm efficiency (+0.5 CS/min).',
      'In Flex Queue: Prioritize vision dominance (1.2 wards/min) and voice-coordinated objective rotations.',
      `Optimal Queue for current profile: ${comparisonData.recommendation}`
    ];

    return {
      ...this.createBaseOutput(insights, recommendations),
      agent_role: this.role,
      comparisonData
    };
  }

  getTools(): AgentTool[] {
    return [];
  }

  private getComparisonData(): QueueComparisonData {
    return {
      metrics: [
        { metric: 'Avg Win Rate', solo: '~49.5-50.5%', flex: '~52-53%', impact: 'Flex favors coordination' },
        { metric: 'Game Length', solo: '28-32 min', flex: '30-35 min', impact: 'Flex plays more objectives' },
        { metric: 'Vision Score', solo: '18-22 wards', flex: '24-28 wards', impact: 'Flex emphasizes vision' },
        { metric: 'Objective Control', solo: '48% drake', flex: '58% drake', impact: 'Flex wins 10%+ more objectives' },
        { metric: 'KDA Variance', solo: 'High', flex: 'Medium', impact: 'Solo rewards individual carry' },
        { metric: 'TP Usage', solo: '42% fights', flex: '68% fights', impact: 'Flex plays more macro' },
      ],
      roleImpacts: {
        JUNGLE: { solo: 0.35, flex: 0.28 },
        MID:    { solo: 0.32, flex: 0.30 },
        TOP:    { solo: 0.22, flex: 0.25 },
        ADC:    { solo: 0.18, flex: 0.24 },
        SUPPORT:{ solo: 0.15, flex: 0.26 }
      },
      soloStrategy: {
        winCondition: 'Individual carry + minimal throws',
        priorities: [
          'Farm efficiency (CS/min +0.5 above average)',
          'Survive (death % <8%)',
          'Pick fights you 100% win',
          'NEVER chase kills across map'
        ],
        keyStats: [
          'CS/min: +0.5 above role average',
          'Solo kill %: 35%+',
          'Vision score/min: 0.6+',
          'Objective participation: 65%+'
        ]
      },
      flexStrategy: {
        winCondition: '5v5 macro execution',
        priorities: [
          'Vision dominance (1.2 wards/min)',
          'Group timing (80% fights 4v4+)',
          'Objective conversion (75%+)',
          'ALWAYS use voice comms'
        ],
        keyStats: [
          'Vision score/min: 1.2+',
          'Objective win %: 65%+',
          'Group fight participation: 85%+',
          'TP usage efficiency: 72%+'
        ]
      },
      recommendation: 'SOLO' // Simplified logic for Sample
    };
  }
}

