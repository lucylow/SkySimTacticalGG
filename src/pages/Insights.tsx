import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Lightbulb,
  RefreshCw,
  Sparkles,
  User,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { PersonalizedInsightCard } from '@/components/insights/PersonalizedInsightCard';
import { api } from '@/services/api';
import { backendApi } from '@/services/backendApi';
import { createInsightEngine } from '@/services/insightEngine';
import type { Insight } from '@/types';
import type { PersonalizedInsight, PlayerInsightReport } from '@/types/insights';
import { mockPlayers } from '@/data/mockData';

export const Insights: React.FC = () => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [personalizedInsights, setPersonalizedInsights] = useState<PersonalizedInsight[]>([]);
  const [playerReport, setPlayerReport] = useState<PlayerInsightReport | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [_loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingPersonalized, setGeneratingPersonalized] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadInsights();
    if (mockPlayers.length > 0 && mockPlayers[0]) {
      setSelectedPlayerId(mockPlayers[0].id);
    }
  }, []);

  const loadInsights = async () => {
    try {
      const data = await api.fetchDashboardData();
      setInsights(data.insights);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    setGenerating(true);
    try {
      // Simulate AI generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const newInsights: Insight[] = [
        {
          id: Date.now().toString(),
          type: 'improvement',
          title: 'Crosshair Placement Analysis',
          description: 'OXY\'s crosshair placement improved 12% at head level during the last 5 matches.',
          priority: 'medium',
          created_at: new Date().toISOString(),
          actionable: false,
        },
        {
          id: (Date.now() + 1).toString(),
          type: 'warning',
          title: 'Utility Usage Decline',
          description: 'Team flash efficiency dropped 18% this week. Review flash timing drills.',
          priority: 'high',
          created_at: new Date().toISOString(),
          actionable: true,
        },
      ];
      
      setInsights((prev) => [...newInsights, ...prev]);
    } finally {
      setGenerating(false);
    }
  };

  const generatePersonalizedInsights = async () => {
    if (!selectedPlayerId) return;
    
    setGeneratingPersonalized(true);
    try {
      const player = mockPlayers.find(p => p.id === selectedPlayerId);
      if (!player) return;

      // Get recent matches
      const matches = await backendApi.getMatches('completed');
      const matchIds = matches.slice(0, 3).map(m => m.id);

      // Create insight engine and generate report
      const insightEngine = createInsightEngine(player.team_id);
      const report = await insightEngine.generatePlayerReport(
        player.id,
        player.name,
        matchIds
      );

      setPlayerReport(report);
      setPersonalizedInsights(report.insights);
    } catch (error) {
      console.error('Failed to generate personalized insights:', error);
    } finally {
      setGeneratingPersonalized(false);
    }
  };

  const filterInsights = (type?: string) => {
    if (!type || type === 'all') return insights;
    return insights.filter((i) => i.type === type);
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
            <h1 className="text-2xl font-bold">AI Insights</h1>
            <p className="text-muted-foreground">
              Intelligent recommendations powered by GRID data
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={loadInsights}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={generateNewInsights} disabled={generating}>
            {generating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate New
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Insights</p>
                <p className="text-2xl font-bold">{insights.length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-destructive">
                  {insights.filter((i) => i.priority === 'high').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actionable</p>
                <p className="text-2xl font-bold text-accent">
                  {insights.filter((i) => i.actionable).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-secondary">{insights.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights List */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Insights Dashboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">
                <Lightbulb className="mr-2 h-4 w-4" />
                General Insights
              </TabsTrigger>
              <TabsTrigger value="personalized">
                <User className="mr-2 h-4 w-4" />
                Personalized Analysis
              </TabsTrigger>
            </TabsList>

            {/* General Insights Tab */}
            <TabsContent value="general" className="mt-4">
              <Tabs defaultValue="all">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="warning">Warnings</TabsTrigger>
                  <TabsTrigger value="improvement">Improvements</TabsTrigger>
                  <TabsTrigger value="success">Successes</TabsTrigger>
                </TabsList>

                {['all', 'warning', 'improvement', 'success'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      {filterInsights(tab === 'all' ? undefined : tab).map((insight) => (
                        <InsightCard key={insight.id} insight={insight} />
                      ))}
                    </div>
                    {filterInsights(tab === 'all' ? undefined : tab).length === 0 && (
                      <div className="py-12 text-center text-muted-foreground">
                        No insights found
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </TabsContent>

            {/* Personalized Insights Tab */}
            <TabsContent value="personalized" className="mt-4 space-y-4">
              {/* Player Selection & Generation */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg">Generate Personalized Insights</CardTitle>
                  <CardDescription>
                    Analyze individual player data to identify recurring mistakes and improvement areas
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={generatePersonalizedInsights}
                    disabled={generatingPersonalized || !selectedPlayerId}
                  >
                    {generatingPersonalized ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Analysis
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Player Report Summary */}
              {playerReport && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {playerReport.player_name} - Insight Summary
                    </CardTitle>
                    <CardDescription>
                      Generated {new Date(playerReport.generated_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4 mb-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Total Insights</p>
                        <p className="text-2xl font-bold">{playerReport.summary.total_insights}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-destructive/10">
                        <p className="text-sm text-muted-foreground">Critical Issues</p>
                        <p className="text-2xl font-bold text-destructive">
                          {playerReport.summary.critical_insights}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-primary/10">
                        <p className="text-sm text-muted-foreground">Focus Areas</p>
                        <p className="text-2xl font-bold text-primary">
                          {playerReport.summary.focus_areas.length}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-accent/10">
                        <p className="text-sm text-muted-foreground">Improvement Potential</p>
                        <p className="text-2xl font-bold text-accent">
                          {Math.round(playerReport.summary.overall_improvement_potential * 100)}%
                        </p>
                      </div>
                    </div>
                    {playerReport.summary.focus_areas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {playerReport.summary.focus_areas.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full text-xs bg-primary/20 text-primary"
                          >
                            {area.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Personalized Insights List */}
              {personalizedInsights.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detailed Insights</h3>
                  <div className="grid gap-4 md:grid-cols-1">
                    {personalizedInsights.map((insight) => (
                      <PersonalizedInsightCard 
                        key={insight.id} 
                        insight={insight}
                        onVisualize={(insight) => {
                          // Handle visualization
                          console.log('Visualize insight:', insight);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="glass-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <User className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      {generatingPersonalized
                        ? 'Analyzing player data...'
                        : 'Select a player and generate personalized insights to see detailed analysis'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};
