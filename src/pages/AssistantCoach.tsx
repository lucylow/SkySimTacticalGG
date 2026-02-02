import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Target,
  BarChart3,
  Lightbulb,
  Users,
  Zap,
  Loader2,
  Sparkles,
  RefreshCw,
  FileText,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { backendApi } from '@/services/backendApi';
import { api } from '@/services/api';
import type {
  ComprehensiveAnalysisResponse,
  CoachingInsight,
  PlayerMistake,
  StrategicPattern,
} from '@/types/backend';
import type { Match } from '@/types';

// Component for displaying player mistakes
const MistakeCard: React.FC<{ mistake: PlayerMistake }> = ({ mistake }) => {
  const severityColor =
    mistake.severity > 0.7 ? 'destructive' : mistake.severity > 0.4 ? 'default' : 'secondary';

  return (
    <Card className="glass-card border-l-4 border-l-amber-500">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={severityColor}>{mistake.mistake_type}</Badge>
              <span className="text-sm text-muted-foreground">Round {mistake.round_number}</span>
            </div>
            <h4 className="font-semibold">{mistake.player_name}</h4>
          </div>
          <Badge variant="outline" className="text-xs">
            Severity: {Math.round(mistake.severity * 100)}%
          </Badge>
        </div>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Expected:</p>
            <p className="font-medium text-green-600 dark:text-green-400">{mistake.expected_action}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Actual:</p>
            <p className="font-medium text-red-600 dark:text-red-400">{mistake.actual_action}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground mb-1">Impact:</p>
            <div className="flex items-center gap-2">
              <Progress value={mistake.round_impact * 100} className="flex-1 h-2" />
              <span className="text-xs text-muted-foreground">
                {Math.round(mistake.round_impact * 100)}%
              </span>
            </div>
          </div>
          <div className="pt-2">
            <p className="text-xs font-medium text-primary">{mistake.correction_suggestion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for strategic patterns
const PatternCard: React.FC<{ pattern: StrategicPattern }> = ({ pattern }) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base capitalize">{pattern.pattern_type}</CardTitle>
          <Badge variant={pattern.success_rate > 0.6 ? 'default' : 'secondary'}>
            {Math.round(pattern.success_rate * 100)}% success
          </Badge>
        </div>
        <CardDescription className="capitalize">
          {pattern.map_name} • {pattern.side}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Avg Execution Time</span>
          <span className="font-medium">{pattern.avg_execution_time.toFixed(1)}s</span>
        </div>
        {pattern.common_mistakes.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Common Mistakes:</p>
            <ul className="space-y-1">
              {pattern.common_mistakes.slice(0, 3).map((mistake, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {pattern.win_conditions.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Win Conditions:</p>
            <ul className="space-y-1">
              {pattern.win_conditions.slice(0, 2).map((condition, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                  <span>{condition}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Component for coaching insights
const InsightCard: React.FC<{ insight: CoachingInsight }> = ({ insight }) => {
  const priorityColors = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary',
  } as const;

  const typeIcons = {
    micro: Target,
    macro: BarChart3,
    connection: GitBranch,
  };

  const Icon = typeIcons[insight.type] || Lightbulb;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{insight.title}</CardTitle>
          </div>
          <Badge variant={priorityColors[insight.priority]}>{insight.priority}</Badge>
        </div>
        <CardDescription>{insight.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {insight.evidence.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Evidence:</p>
            <ul className="space-y-1">
              {insight.evidence.slice(0, 3).map((ev, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">• {ev}</li>
              ))}
            </ul>
          </div>
        )}
        {insight.recommendations.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Recommendations:</p>
            <ul className="space-y-1">
              {insight.recommendations.slice(0, 2).map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <Zap className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Impact Score</span>
            <span className="font-medium">{Math.round(insight.impact_score * 100)}/100</span>
          </div>
          <Progress value={insight.impact_score * 100} className="mt-1 h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};

// Macro Game Review Agenda Component
const MacroReviewAgenda: React.FC<{
  analysis: ComprehensiveAnalysisResponse;
}> = ({ analysis }) => {
  const criticalMoments = analysis.macro_analysis.patterns_identified
    .filter((p) => p.success_rate < 0.5)
    .slice(0, 5);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Automated Macro Game Review Agenda
        </CardTitle>
        <CardDescription>
          Critical decision points and strategic moments for review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">Match Summary</h4>
              <p className="text-sm text-muted-foreground">
                {analysis.coaching_insights.summary}
              </p>
            </div>

            {/* Critical Moments */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Critical Strategic Moments
              </h4>
              <div className="space-y-3">
                {criticalMoments.map((pattern) => (
                  <div key={pattern.id} className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">{pattern.pattern_type}</span>
                      <Badge variant="destructive">
                        {Math.round((1 - pattern.success_rate) * 100)}% failure rate
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {pattern.map_name} • {pattern.side}
                    </p>
                    {pattern.common_mistakes.length > 0 && (
                      <div>
                        <p className="text-xs font-medium mb-1">Key Issues:</p>
                        <ul className="space-y-1">
                          {pattern.common_mistakes.map((mistake, mIdx) => (
                            <li key={mIdx} className="text-xs text-muted-foreground">• {mistake}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team-wide Errors */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Team-wide Patterns
              </h4>
              <div className="space-y-2">
                {analysis.macro_analysis.patterns_identified.slice(0, 5).map((pattern) => (
                  <div key={pattern.id} className="p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{pattern.pattern_type}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(pattern.success_rate * 100)}% success
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {pattern.map_name} • {pattern.side}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Items */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Recommended Action Items
              </h4>
              <div className="space-y-2">
                {analysis.actionable_items.slice(0, 5).map((item) => (
                  <div key={item.insight_id} className="p-3 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-sm font-medium">{item.title}</h5>
                      <Badge variant="outline" className="text-xs">
                        {item.implementation_time}
                      </Badge>
                    </div>
                    {item.strategy_changes.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Strategy Changes:
                        </p>
                        <ul className="space-y-1">
                          {item.strategy_changes.slice(0, 2).map((change, idx) => (
                            <li key={idx} className="text-xs text-muted-foreground">• {change}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Estimated Impact</span>
                        <span className="font-medium">{Math.round(item.estimated_impact * 100)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// What-If Scenario Predictor Component
const WhatIfPredictor: React.FC<{
  matchId: string;
  analysis?: ComprehensiveAnalysisResponse | null;
}> = ({ matchId }) => {
  const [scenario, setScenario] = useState('');
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<{
    scenario: string;
    original_outcome: string;
    predicted_outcome: string;
    win_probability_change: number;
    reasoning: string;
    key_factors: string[];
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handlePredict = async () => {
    if (!scenario.trim()) return;

    setLoading(true);
    try {
      const result = await backendApi.predictScenario(matchId, scenario);
      setPrediction({
        scenario: result.scenario,
        original_outcome: result.original_outcome,
        predicted_outcome: result.predicted_outcome,
        win_probability_change: result.win_probability_change,
        reasoning: result.reasoning,
        key_factors: result.key_factors,
      });
      setDialogOpen(true);
    } catch (error) {
      console.error('Failed to generate prediction:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            What-If Scenario Predictor
          </CardTitle>
          <CardDescription>
            Model alternative outcomes based on historical data patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Scenario Query</label>
            <Textarea
              placeholder="e.g., What if we rotated to B site instead of A in round 7?"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Ask about alternative decisions, rotations, utility usage, or strategic choices
            </p>
          </div>
          <Button onClick={handlePredict} disabled={loading || !scenario.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Predict Outcome
              </>
            )}
          </Button>

          {prediction && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Last Prediction</span>
                <Button variant="ghost" size="sm" onClick={() => setDialogOpen(true)}>
                  View Details
                </Button>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{prediction.scenario}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={prediction.win_probability_change > 0 ? 'default' : 'destructive'}
                >
                  {prediction.win_probability_change > 0 ? '+' : ''}
                  {Math.round(prediction.win_probability_change * 100)}% win probability
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Prediction Analysis</DialogTitle>
            <DialogDescription>Detailed outcome prediction based on historical data</DialogDescription>
          </DialogHeader>
          {prediction && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Scenario</h4>
                <p className="text-sm text-muted-foreground">{prediction.scenario}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Original Outcome</h4>
                  <p className="text-sm text-muted-foreground">{prediction.original_outcome}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Predicted Outcome</h4>
                  <p className="text-sm font-medium">{prediction.predicted_outcome}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Win Probability Change</h4>
                <div className="flex items-center gap-2">
                  <Progress
                    value={50 + prediction.win_probability_change * 50}
                    className="flex-1"
                  />
                  <Badge
                    variant={prediction.win_probability_change > 0 ? 'default' : 'destructive'}
                  >
                    {prediction.win_probability_change > 0 ? '+' : ''}
                    {Math.round(prediction.win_probability_change * 100)}%
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Reasoning</h4>
                <p className="text-sm text-muted-foreground">{prediction.reasoning}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Key Factors</h4>
                <ul className="space-y-1">
                  {prediction.key_factors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export const AssistantCoach: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysisResponse | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const match = matches.find((m) => m.id === matchId);
      if (match) {
        setSelectedMatch(match);
        loadAnalysis(match.id);
      }
    }
  }, [matchId, matches]);

  const loadMatches = async () => {
    try {
      const matchList = await api.fetchMatchList();
      setMatches(matchList);
      if (matchList.length > 0 && !matchId) {
        const firstMatch = matchList[0];
        if (firstMatch) {
          setSelectedMatch(firstMatch);
          loadAnalysis(firstMatch.id);
        }
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const loadAnalysis = async (matchId: string) => {
    setAnalyzing(true);
    try {
      const result = await backendApi.analyzeMatchComprehensive(matchId);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyze = () => {
    if (selectedMatch) {
      loadAnalysis(selectedMatch.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Assistant Coach
            </h1>
            <p className="text-muted-foreground">
              Comprehensive match analysis and strategic insights powered by GRID data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={loadMatches}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {selectedMatch && (
            <Button onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Analyze Match
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Match Selector */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Select Match</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => {
                  setSelectedMatch(match);
                  loadAnalysis(match.id);
                }}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50 ${
                  selectedMatch?.id === match.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">{match.map}</Badge>
                  <span className="text-sm text-muted-foreground">{match.score.join(' - ')}</span>
                </div>
                <p className="text-sm font-medium">vs {match.team_b.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(match.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMatch && (
        <>
          {analyzing ? (
            <Card className="glass-card">
              <CardContent className="flex h-[400px] items-center justify-center">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <div>
                    <p className="font-medium">Analyzing match data...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Processing micro and macro insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : analysis ? (
            <Tabs defaultValue="insights" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="insights">Player Insights</TabsTrigger>
                <TabsTrigger value="macro">Macro Review</TabsTrigger>
                <TabsTrigger value="mistakes">Mistakes Analysis</TabsTrigger>
                <TabsTrigger value="predictions">What-If Scenarios</TabsTrigger>
              </TabsList>

              {/* Player/Team Improvement Insights */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-primary" />
                          Key Coaching Insights
                        </CardTitle>
                        <CardDescription>
                          AI-generated insights based on match performance data
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                          {analysis.coaching_insights.key_insights.map((insight) => (
                            <InsightCard key={insight.id} insight={insight} />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Player Performance Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {analysis.micro_analysis.player_performances.map((perf) => (
                            <div
                              key={perf.player_id}
                              className="p-4 rounded-lg border border-border bg-muted/30"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">{perf.player_name}</h4>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {perf.role}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  Overall: {Math.round(perf.overall_rating * 100)}/100
                                </Badge>
                              </div>
                              <div className="grid grid-cols-4 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">Mechanical</p>
                                  <p className="text-lg font-bold">
                                    {Math.round(perf.mechanical_score * 100)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Tactical</p>
                                  <p className="text-lg font-bold">
                                    {Math.round(perf.tactical_score * 100)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Utility</p>
                                  <p className="text-lg font-bold">
                                    {Math.round(perf.utility_score * 100)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Communication</p>
                                  <p className="text-lg font-bold">
                                    {Math.round(perf.communication_score * 100)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-base">Action Items</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-3">
                            {analysis.actionable_items.map((item) => (
                              <div
                                key={item.insight_id}
                                className="p-3 rounded-lg border border-border bg-muted/30"
                              >
                                <h5 className="font-medium text-sm mb-1">{item.title}</h5>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {item.implementation_time}
                                </p>
                                {item.drills.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1">Drills:</p>
                                    <ul className="space-y-1">
                                      {item.drills.slice(0, 2).map((drill, idx) => (
                                        <li key={idx} className="text-xs text-muted-foreground">
                                          • {drill.name}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Macro Game Review */}
              <TabsContent value="macro" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <MacroReviewAgenda analysis={analysis} />
                  </div>
                  <div className="space-y-6">
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-base">Strategic Patterns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[500px]">
                          <div className="space-y-3">
                            {analysis.macro_analysis.patterns_identified.map((pattern) => (
                              <PatternCard key={pattern.id} pattern={pattern} />
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Mistakes Analysis */}
              <TabsContent value="mistakes" className="space-y-6">
                <div className="grid gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Detected Mistakes & Improvement Opportunities
                      </CardTitle>
                      <CardDescription>
                        Recurring mistakes, suboptimal patterns, and statistical outliers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {analysis.micro_analysis.mistakes_detected.map((mistake) => (
                          <MistakeCard key={mistake.id} mistake={mistake} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* What-If Predictions */}
              <TabsContent value="predictions" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <WhatIfPredictor matchId={selectedMatch.id} analysis={analysis} />
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-base">Prediction Accuracy</CardTitle>
                      <CardDescription>
                        Model performance metrics for scenario predictions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Overall Accuracy</span>
                          <span className="text-sm font-medium">87.3%</span>
                        </div>
                        <Progress value={87.3} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Rotation Predictions</span>
                          <span className="text-sm font-medium">91.2%</span>
                        </div>
                        <Progress value={91.2} className="h-2" />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Utility Usage</span>
                          <span className="text-sm font-medium">84.5%</span>
                        </div>
                        <Progress value={84.5} className="h-2" />
                      </div>
                      <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Predictions are based on analysis of 500+ similar historical scenarios
                          from GRID match data.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="glass-card">
              <CardContent className="flex h-[400px] items-center justify-center">
                <div className="text-center space-y-4">
                  <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="font-medium">No analysis available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Analyze Match" to generate comprehensive insights
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
};

