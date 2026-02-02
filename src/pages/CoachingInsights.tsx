import React, { useEffect, useState, useMemo } from 'react';
import { 
  Target, 
  BarChart3, 
  GitBranch, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users,
  TrendingDown,
  TrendingUp,
  ChevronRight,
  Lightbulb,
  Activity,
  Zap,
  Filter,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { backendApi } from '@/services/backendApi';
import type { CoachingInsight, ActionItem, PlayerMistake, StrategicPattern } from '@/types/backend';

// Connection visualization component
const MicroMacroConnection: React.FC<{
  insight: CoachingInsight;
  mistakes: PlayerMistake[];
  patterns: StrategicPattern[];
}> = ({ insight, mistakes, patterns }) => {
  const relatedMistakes = mistakes.filter(m => 
    insight.metadata?.player_ids?.includes(m.player_id) ||
    insight.metadata?.mistake_type === m.mistake_type
  );

  const relatedPattern = patterns.find(p => 
    p.common_mistakes.some(cm => {
      const firstWord = cm.toLowerCase().split(' ')[0];
      return firstWord ? insight.description.toLowerCase().includes(firstWord) : false;
    })
  );

  return (
    <div className="relative">
      {/* Connection Flow */}
      <div className="flex items-stretch gap-4">
        {/* Micro Level - Player Mistakes */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">Micro (Player)</span>
          </div>
          {relatedMistakes.slice(0, 2).map((mistake) => (
            <div 
              key={mistake.id} 
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{mistake.player_name}</span>
                <Badge variant="outline" className="text-xs">
                  R{mistake.round_number}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{mistake.actual_action}</p>
              <div className="mt-2 flex items-center gap-2">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-xs text-destructive">
                  {(mistake.round_impact * 100).toFixed(0)}% round impact
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Connection Arrow */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="h-full w-px bg-gradient-to-b from-destructive via-primary to-primary/50" />
          <GitBranch className="h-5 w-5 text-primary my-2" />
          <div className="h-full w-px bg-gradient-to-b from-primary/50 via-primary to-accent" />
        </div>

        {/* Macro Level - Team Strategy */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Macro (Team)</span>
          </div>
          {relatedPattern && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium capitalize">
                  {relatedPattern.pattern_type} Strategy
                </span>
                <Badge variant="secondary" className="text-xs">
                  {(relatedPattern.success_rate * 100).toFixed(0)}% success
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Common issues: {relatedPattern.common_mistakes.slice(0, 2).join(', ')}
              </p>
              <div className="flex flex-wrap gap-1">
                {relatedPattern.win_conditions.slice(0, 2).map((cond, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cond.split(' ').slice(0, 3).join(' ')}...
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3 w-3 text-accent" />
              <span className="text-xs font-medium">Strategy Impact</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {insight.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Insight detail card with expanded information
const InsightDetailCard: React.FC<{
  insight: CoachingInsight;
  actionItem?: ActionItem;
}> = ({ insight, actionItem }) => {
  const priorityConfig = {
    high: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
    medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    low: { color: 'text-muted-foreground', bg: 'bg-muted/10', border: 'border-muted/30' },
  };

  const typeConfig = {
    micro: { icon: Target, label: 'Individual', color: 'text-destructive' },
    macro: { icon: BarChart3, label: 'Team-wide', color: 'text-primary' },
    connection: { icon: GitBranch, label: 'Micro→Macro', color: 'text-accent' },
  };

  const config = priorityConfig[insight.priority];
  const typeInfo = typeConfig[insight.type];
  const TypeIcon = typeInfo.icon;

  return (
    <Card className={`${config.bg} ${config.border} border`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${config.bg}`}>
              <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{insight.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {typeInfo.label}
                </Badge>
                <Badge 
                  variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {insight.priority} priority
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{(insight.impact_score * 100).toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Impact Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{insight.description}</p>

        {/* Evidence */}
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Evidence
          </h4>
          <div className="space-y-1">
            {insight.evidence.map((ev, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
            <Lightbulb className="h-3 w-3" />
            Recommendations
          </h4>
          <div className="space-y-1">
            {insight.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Drills from Action Items */}
        {actionItem && actionItem.drills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Suggested Drills
            </h4>
            <div className="grid gap-2">
              {actionItem.drills.slice(0, 2).map((drill, idx) => (
                <div 
                  key={idx} 
                  className="p-2 rounded-md bg-background/50 border border-border/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{drill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-2.5 w-2.5 mr-1" />
                      {drill.duration}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{drill.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Time */}
        {actionItem && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Est. Implementation</span>
            <Badge variant="secondary">{actionItem.implementation_time}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Impact summary card
const ImpactSummary: React.FC<{
  insights: CoachingInsight[];
}> = ({ insights }) => {
  const avgImpact = insights.reduce((sum, i) => sum + i.impact_score, 0) / insights.length;
  const highPriority = insights.filter(i => i.priority === 'high').length;
  const connections = insights.filter(i => i.type === 'connection').length;

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Analysis Summary
        </CardTitle>
        <CardDescription>
          Micro-macro connection analysis results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {(avgImpact * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Avg Impact</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-destructive">
              {highPriority}
            </div>
            <div className="text-xs text-muted-foreground">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">
              {connections}
            </div>
            <div className="text-xs text-muted-foreground">Connections Found</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Micro Issues</span>
            <span className="font-medium">{insights.filter(i => i.type === 'micro').length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Macro Issues</span>
            <span className="font-medium">{insights.filter(i => i.type === 'macro').length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Linked Patterns</span>
            <span className="font-medium">{connections}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Filter controls component
const FilterControls: React.FC<{
  players: string[];
  selectedPlayer: string;
  onPlayerChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  selectedPriority: string;
  onPriorityChange: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}> = ({
  players,
  selectedPlayer,
  onPlayerChange,
  selectedType,
  onTypeChange,
  selectedPriority,
  onPriorityChange,
  onReset,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/30 border">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="h-4 w-4" />
        Filters:
      </div>
      
      <Select value={selectedPlayer} onValueChange={onPlayerChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Players" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Players</SelectItem>
          {players.map((player) => (
            <SelectItem key={player} value={player}>
              {player}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={onTypeChange}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="micro">
            <div className="flex items-center gap-2">
              <Target className="h-3 w-3 text-destructive" />
              Micro (Individual)
            </div>
          </SelectItem>
          <SelectItem value="macro">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-3 w-3 text-primary" />
              Macro (Team)
            </div>
          </SelectItem>
          <SelectItem value="connection">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3 text-accent" />
              Connection
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPriority} onValueChange={onPriorityChange}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="All Priorities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priorities</SelectItem>
          <SelectItem value="high">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive" />
              High
            </div>
          </SelectItem>
          <SelectItem value="medium">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Medium
            </div>
          </SelectItem>
          <SelectItem value="low">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-muted-foreground" />
              Low
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-9 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Reset
        </Button>
      )}
    </div>
  );
};

export const CoachingInsights: React.FC = () => {
  const [insights, setInsights] = useState<CoachingInsight[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [mistakes, setMistakes] = useState<PlayerMistake[]>([]);
  const [patterns, setPatterns] = useState<StrategicPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Filter state
  const [selectedPlayer, setSelectedPlayer] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coachingData, matchAnalysis, patternsData] = await Promise.all([
          backendApi.generateCoachingInsights('t1', 'grid_match_001'),
          backendApi.analyzeMatchComprehensive('grid_match_001'),
          backendApi.getStrategicPatterns('t1'),
        ]);

        setInsights(coachingData.key_insights);
        setActionItems(coachingData.action_items);
        setMistakes(matchAnalysis.micro_analysis.mistakes_detected);
        setPatterns(patternsData);
      } catch (error) {
        console.error('Failed to load coaching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Extract unique player names from mistakes and insights
  const uniquePlayers = useMemo(() => {
    const playerSet = new Set<string>();
    mistakes.forEach((m) => playerSet.add(m.player_name));
    insights.forEach((i) => {
      i.metadata?.player_ids?.forEach((id: string) => {
        // Try to find matching player name from mistakes
        const matchingMistake = mistakes.find((m) => m.player_id === id);
        if (matchingMistake) playerSet.add(matchingMistake.player_name);
      });
    });
    return Array.from(playerSet).sort();
  }, [mistakes, insights]);

  // Filter insights based on selected filters
  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      // Filter by type
      if (selectedType !== 'all' && insight.type !== selectedType) {
        return false;
      }
      
      // Filter by priority
      if (selectedPriority !== 'all' && insight.priority !== selectedPriority) {
        return false;
      }
      
      // Filter by player
      if (selectedPlayer !== 'all') {
        const relatedMistake = mistakes.find(
          (m) =>
            m.player_name === selectedPlayer &&
            (insight.metadata?.player_ids?.includes(m.player_id) ||
              insight.metadata?.mistake_type === m.mistake_type)
        );
        if (!relatedMistake) {
          return false;
        }
      }
      
      return true;
    });
  }, [insights, selectedType, selectedPriority, selectedPlayer, mistakes]);

  const hasActiveFilters = selectedPlayer !== 'all' || selectedType !== 'all' || selectedPriority !== 'all';

  const resetFilters = () => {
    setSelectedPlayer('all');
    setSelectedType('all');
    setSelectedPriority('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Analyzing micro-macro connections...</p>
        </div>
      </div>
    );
  }

  const connectionInsights = filteredInsights.filter(i => i.type === 'connection');
  const microInsights = filteredInsights.filter(i => i.type === 'micro');
  const macroInsights = filteredInsights.filter(i => i.type === 'macro');

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitBranch className="h-6 w-6 text-primary" />
          Coaching Insights Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Connecting individual player mistakes to team strategy failures
        </p>
      </div>

      {/* Filter Controls */}
      <FilterControls
        players={uniquePlayers}
        selectedPlayer={selectedPlayer}
        onPlayerChange={setSelectedPlayer}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        onReset={resetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Showing</span>
          <Badge variant="secondary">{filteredInsights.length}</Badge>
          <span className="text-muted-foreground">of {insights.length} insights</span>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="actions" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Action Items
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Summary Card - always show full insights for summary */}
            <ImpactSummary insights={filteredInsights} />

            {/* All Insights */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Insights</CardTitle>
                  <CardDescription>
                    {filteredInsights.length} insights {hasActiveFilters ? 'matching filters' : 'identified from recent matches'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {filteredInsights.length > 0 ? (
                        filteredInsights.map((insight) => (
                          <InsightDetailCard
                            key={insight.id}
                            insight={insight}
                            actionItem={actionItems.find(a => a.insight_id === insight.id)}
                          />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No insights match the current filters. Try adjusting your filter criteria.
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Micro → Macro Connections
              </CardTitle>
              <CardDescription>
                How individual mistakes cascade into team-wide strategy failures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {connectionInsights.length > 0 ? (
                  connectionInsights.map((insight) => (
                    <div key={insight.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{insight.title}</h3>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : 'secondary'}
                        >
                          {(insight.impact_score * 100).toFixed(0)}% impact
                        </Badge>
                      </div>
                      <MicroMacroConnection
                        insight={insight}
                        mistakes={mistakes}
                        patterns={patterns}
                      />
                      <Separator />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No direct micro-macro connections detected in this analysis.
                  </p>
                )}

                {/* Also show individual micro/macro insights */}
                <div className="grid md:grid-cols-2 gap-6 pt-4">
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-destructive" />
                      Micro-Level Issues ({microInsights.length})
                    </h3>
                    <div className="space-y-2">
                      {microInsights.map((insight) => (
                        <div 
                          key={insight.id}
                          className="p-3 rounded-lg bg-destructive/5 border border-destructive/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{insight.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {(insight.impact_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Macro-Level Issues ({macroInsights.length})
                    </h3>
                    <div className="space-y-2">
                      {macroInsights.map((insight) => (
                        <div 
                          key={insight.id}
                          className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{insight.title}</span>
                            <Badge variant="outline" className="text-xs">
                              {(insight.impact_score * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {insight.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Items Tab */}
        <TabsContent value="actions" className="space-y-6">
          <div className="grid gap-6">
            {actionItems.map((item) => {
              return (
                <Card key={item.insight_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {item.implementation_time}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className="bg-green-500/10 text-green-600 border-green-500/30"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{(item.estimated_impact * 100).toFixed(0)}% potential
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Drills */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Practice Drills
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        {item.drills.map((drill, idx) => (
                          <div 
                            key={idx}
                            className="p-3 rounded-lg border bg-card"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{drill.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {drill.duration}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">
                              {drill.description}
                            </p>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Focus:</span>
                              <Badge variant="secondary" className="text-xs">
                                {drill.focus}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strategy Changes */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        Strategy Changes
                      </h4>
                      <div className="space-y-2">
                        {item.strategy_changes.map((change, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{change}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Player Feedback */}
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4 text-accent" />
                        Player Feedback
                      </h4>
                      <div className="space-y-2">
                        {item.player_feedback.map((fb, idx) => (
                          <div 
                            key={idx}
                            className="p-3 rounded-lg bg-accent/5 border border-accent/20"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm">{fb.player_name}</span>
                              <Badge 
                                variant={fb.priority === 'high' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {fb.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{fb.feedback}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
