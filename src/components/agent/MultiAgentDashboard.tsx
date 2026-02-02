// Multi-Agent Dashboard Component
// Displays insights from all specialized AI agents

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Target,
  Users,
  Eye,
  BookOpen,
  Radio,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { backendApi } from '@/services/backendApi';
import type {
  AgentOrchestrationResponse,
  AgentRole,
  CombinedInsight,
  MatchContextInput,
  OpponentDataInput,
} from '@/types/agents';
import type { GridDataPacket } from '@/types/grid';

interface MultiAgentDashboardProps {
  gridData?: GridDataPacket[];
  matchContext?: MatchContextInput;
  opponentData?: OpponentDataInput;
  onInsightClick?: (insight: CombinedInsight) => void;
}

const agentIcons: Record<AgentRole, React.ReactNode> = {
  micro_mistake_detector: <Target className="w-5 h-5" />,
  macro_strategy_analyst: <Users className="w-5 h-5" />,
  opponent_scouting: <Eye className="w-5 h-5" />,
  predictive_playbook: <BookOpen className="w-5 h-5" />,
  prosthetic_coach: <Radio className="w-5 h-5" />,
};

const agentNames: Record<AgentRole, string> = {
  micro_mistake_detector: 'Micro-Mistake Detector',
  macro_strategy_analyst: 'Macro-Strategy Analyst',
  opponent_scouting: 'Opponent Scouting',
  predictive_playbook: 'Predictive Playbook',
  prosthetic_coach: 'Prosthetic Coach',
};

const agentColors: Record<AgentRole, string> = {
  micro_mistake_detector: 'bg-red-500/10 text-red-500 border-red-500/20',
  macro_strategy_analyst: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  opponent_scouting: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  predictive_playbook: 'bg-green-500/10 text-green-500 border-green-500/20',
  prosthetic_coach: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
};

export const MultiAgentDashboard: React.FC<MultiAgentDashboardProps> = ({
  gridData = [],
  matchContext,
  opponentData,
  onInsightClick,
}) => {
  const [orchestrationResult, setOrchestrationResult] = useState<AgentOrchestrationResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');

  const runOrchestration = useCallback(async () => {
    setLoading(true);
    try {
      const result = await backendApi.orchestrateAgents({
        agents: [
          'micro_mistake_detector',
          'macro_strategy_analyst',
          'opponent_scouting',
          'predictive_playbook',
          'prosthetic_coach',
        ],
        input: {
          grid_data: gridData,
          match_context: matchContext,
          opponent_data: opponentData,
        },
        coordination_strategy: 'hierarchical',
        context_sharing: true,
      });
      setOrchestrationResult(result);
    } catch (error) {
      console.error('Agent orchestration failed:', error);
    } finally {
      setLoading(false);
    }
  }, [gridData, matchContext, opponentData]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Running agent analysis...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!orchestrationResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No agent analysis available. Provide GRID data to run analysis.
          </p>
          <Button
            onClick={() => {
              void runOrchestration();
            }}
            className="mt-4"
            size="sm"
          >
            Run Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Multi-Agent Analysis</CardTitle>
              <CardDescription>
                Insights from {orchestrationResult.agent_outputs.length} specialized agents
              </CardDescription>
            </div>
            <Badge variant="outline">{orchestrationResult.execution_time_ms}ms</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="insights">Combined Insights</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orchestrationResult.agent_outputs.map((output) => (
                  <Card key={output.agent_role} className={agentColors[output.agent_role]}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        {agentIcons[output.agent_role]}
                        <CardTitle className="text-sm">{agentNames[output.agent_role]}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Insights</span>
                          <Badge variant="secondary">{output.insights.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Confidence</span>
                          <Badge variant="outline">{Math.round(output.confidence * 100)}%</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {orchestrationResult.agent_outputs.map((output) => (
                  <Card key={output.agent_role} className="mb-4">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {agentIcons[output.agent_role]}
                          <CardTitle className="text-base">
                            {agentNames[output.agent_role]}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">
                          {Math.round(output.confidence * 100)}% confidence
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {output.recommendations.slice(0, 3).map((rec, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground">
                              • {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Top Insights</h4>
                        <div className="space-y-2">
                          {output.insights.slice(0, 3).map((insight) => (
                            <div
                              key={insight.id}
                              className="p-2 rounded-md bg-muted text-sm cursor-pointer hover:bg-muted/80"
                              onClick={() => onInsightClick?.({
                                insight_id: insight.id,
                                source_agents: [output.agent_role],
                                title: insight.title,
                                description: insight.description,
                                confidence: insight.severity,
                                priority: insight.severity > 0.7 ? 'high' : insight.severity > 0.4 ? 'medium' : 'low',
                                actionable: insight.actionable,
                              })}
                            >
                              <div className="flex items-start justify-between">
                                <span className="font-medium">{insight.title}</span>
                                <Badge variant="outline" className="ml-2">
                                  {Math.round(insight.severity * 100)}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {insight.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {orchestrationResult.combined_insights.map((insight) => (
                    <Card
                      key={insight.insight_id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onInsightClick?.(insight)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getPriorityIcon(insight.priority)}
                              <h4 className="font-medium">{insight.title}</h4>
                              <Badge
                                className={getPriorityColor(insight.priority)}
                                variant="default"
                              >
                                {insight.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {insight.description}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-muted-foreground">Sources:</span>
                              {insight.source_agents.map((role) => (
                                <Badge key={role} variant="outline" className={agentColors[role]}>
                                  {agentNames[role]}
                                </Badge>
                              ))}
                              <Badge variant="secondary" className="ml-auto">
                                {Math.round(insight.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
