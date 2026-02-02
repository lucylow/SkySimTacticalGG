import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Loader2,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlayerCard } from '@/components/dashboard/PlayerCard';
import { MotionViewer } from '@/components/motion/MotionViewer';
import { api } from '@/services/api';
import { backendApi } from '@/services/backendApi';
import type { Player, Mistake } from '@/types';
import type { DevelopmentPlan, FocusArea, WeeklyGoal, SkillProgression } from '@/types/backend';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Play, Eye } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

// Skill progression chart component
const SkillProgressionChart: React.FC<{ progressions: SkillProgression[] }> = ({ progressions }) => {
  const data = [
    { week: 'Current', ...Object.fromEntries(progressions.map(p => [p.skill, p.current * 100])) },
    { week: 'Week 1', ...Object.fromEntries(progressions.map(p => [p.skill, (p.projected[0] ?? 0) * 100])) },
    { week: 'Week 2', ...Object.fromEntries(progressions.map(p => [p.skill, (p.projected[1] ?? 0) * 100])) },
    { week: 'Week 3', ...Object.fromEntries(progressions.map(p => [p.skill, (p.projected[2] ?? 0) * 100])) },
    { week: 'Week 4', ...Object.fromEntries(progressions.map(p => [p.skill, (p.projected[3] ?? 0) * 100])) },
  ];

  const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Legend />
        {progressions.map((prog, idx) => (
          <Area
            key={prog.skill}
            type="monotone"
            dataKey={prog.skill}
            stroke={colors[idx % colors.length]}
            fill={colors[idx % colors.length]}
            fillOpacity={0.1}
            strokeWidth={2}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Focus areas radar chart
const FocusAreasRadar: React.FC<{ focusAreas: FocusArea[] }> = ({ focusAreas }) => {
  const data = focusAreas.map(area => ({
    subject: area.area,
    current: area.current_level * 100,
    target: area.target_level * 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={11} />
        <PolarRadiusAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
        <Radar
          name="Current"
          dataKey="current"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.3}
        />
        <Radar
          name="Target"
          dataKey="target"
          stroke="hsl(var(--accent))"
          fill="hsl(var(--accent))"
          fillOpacity={0.2}
        />
        <Legend />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

// Weekly goal card component
const WeeklyGoalCard: React.FC<{ goal: WeeklyGoal; isActive?: boolean }> = ({ goal, isActive }) => (
  <Card className={`transition-all ${isActive ? 'ring-2 ring-primary bg-primary/5' : 'glass-card'}`}>
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Week {goal.week}
        </CardTitle>
        {isActive && (
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Current
          </Badge>
        )}
      </div>
      <CardDescription className="flex items-center gap-1 text-xs">
        <TrendingUp className="h-3 w-3" />
        Expected improvement: +{Math.round(goal.expected_improvement * 100)}%
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Objectives</p>
        <ul className="space-y-1.5">
          {goal.objectives.map((obj, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Metrics to Track</p>
        <div className="flex flex-wrap gap-1.5">
          {goal.metrics_to_track.map((metric, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {metric}
            </Badge>
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);

// Focus area card component
const FocusAreaCard: React.FC<{ area: FocusArea }> = ({ area }) => {
  const progressPercent = (area.current_level / area.target_level) * 100;
  
  return (
    <Card className="glass-card">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">{area.area}</h4>
          <Badge
            variant={area.priority === 'high' ? 'destructive' : area.priority === 'medium' ? 'default' : 'secondary'}
          >
            {area.priority}
          </Badge>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Current: {Math.round(area.current_level * 100)}%</span>
            <span>Target: {Math.round(area.target_level * 100)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Exercises</p>
          <ul className="space-y-1">
            {area.exercises.slice(0, 2).map((exercise, idx) => (
              <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                {exercise}
              </li>
            ))}
            {area.exercises.length > 2 && (
              <li className="text-xs text-primary">+{area.exercises.length - 2} more</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export const PlayerDevelopment: React.FC = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [developmentPlan, setDevelopmentPlan] = useState<DevelopmentPlan | null>(null);
  const [_progressMetrics, setProgressMetrics] = useState<Record<string, number> | null>(null);
  const [playerMistakes, setPlayerMistakes] = useState<Mistake[]>([]);
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);
  const [motionDialogOpen, setMotionDialogOpen] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [planLoading, setPlanLoading] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (selectedPlayer) {
      loadDevelopmentPlan(selectedPlayer.id);
    }
  }, [selectedPlayer]);

  const loadPlayers = async () => {
    try {
      const playerList = await api.fetchPlayerList();
      setPlayers(playerList);
      if (playerList.length > 0 && playerList[0]) {
        setSelectedPlayer(playerList[0]);
      }
    } catch (error) {
      console.error('Failed to load players:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevelopmentPlan = async (playerId: string) => {
    setPlanLoading(true);
    try {
      const result = await backendApi.generateDevelopmentPlan(playerId, 30);
      setDevelopmentPlan(result.development_plan);
      setProgressMetrics(result.progress_metrics);
      
      // Load player mistakes for ghost replay
      loadPlayerMistakes(playerId);
    } catch (error) {
      console.error('Failed to load development plan:', error);
    } finally {
      setPlanLoading(false);
    }
  };

  const loadPlayerMistakes = async (playerId: string) => {
    // Mock mistakes - in production, would come from assistant coach analysis
    const mockMistakes: Mistake[] = [
      {
        id: 'm1',
        player_id: playerId,
        player_name: selectedPlayer?.name || 'Player',
        type: 'predictable_positioning',
        severity: 0.7,
        description: 'Held predictable angle that enemies could pre-aim',
        recommendation: 'Vary positioning and use off-angles to avoid being pre-aimed',
      },
      {
        id: 'm2',
        player_id: playerId,
        player_name: selectedPlayer?.name || 'Player',
        type: 'utility_timing',
        severity: 0.6,
        description: 'Used utility too late in the round',
        recommendation: 'Use utility earlier to create opportunities',
      },
      {
        id: 'm3',
        player_id: playerId,
        player_name: selectedPlayer?.name || 'Player',
        type: 'trading',
        severity: 0.7,
        description: 'Missed trade opportunity after teammate death',
        recommendation: 'React faster to teammate deaths and attempt trades',
      },
    ];
    setPlayerMistakes(mockMistakes);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Player Development Tracker</h1>
          <p className="text-muted-foreground">
            AI-powered skill progression and training goals
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Player List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Team Roster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selected={selectedPlayer?.id === player.id}
                onClick={() => setSelectedPlayer(player)}
              />
            ))}
          </CardContent>
        </Card>

        {/* Player Details & Development Plan */}
        <div className="space-y-6 lg:col-span-3">
          {selectedPlayer ? (
            <>
              {/* Player Header Card */}
              <Card className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-white">
                        {selectedPlayer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{selectedPlayer.name}</CardTitle>
                        <p className="capitalize text-muted-foreground">
                          {selectedPlayer.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        30-day plan
                      </Badge>
                      {planLoading && (
                        <Badge variant="secondary" className="gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing...
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {selectedPlayer.stats.kd_ratio}
                      </p>
                      <p className="text-xs text-muted-foreground">K/D Ratio</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-secondary">
                        {selectedPlayer.stats.adr}
                      </p>
                      <p className="text-xs text-muted-foreground">ADR</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-accent">
                        {selectedPlayer.stats.kast}%
                      </p>
                      <p className="text-xs text-muted-foreground">KAST</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {selectedPlayer.stats.first_bloods}
                      </p>
                      <p className="text-xs text-muted-foreground">First Bloods</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <p className="text-2xl font-bold text-accent">
                        {selectedPlayer.stats.clutches_won}
                      </p>
                      <p className="text-xs text-muted-foreground">Clutches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Development Plan Tabs */}
              <Tabs defaultValue="progression" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="progression">Skill Progression</TabsTrigger>
                  <TabsTrigger value="focus">Focus Areas</TabsTrigger>
                  <TabsTrigger value="goals">Weekly Goals</TabsTrigger>
                  <TabsTrigger value="ghost">Ghost Replay</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                {/* Skill Progression Tab */}
                <TabsContent value="progression" className="space-y-4">
                  {planLoading ? (
                    <Card className="glass-card">
                      <CardContent className="flex h-[350px] items-center justify-center">
                        <div className="text-center space-y-2">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                          <p className="text-muted-foreground">Generating skill analysis...</p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : developmentPlan ? (
                    <>
                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Projected Skill Growth
                          </CardTitle>
                          <CardDescription>
                            AI-predicted improvement over the next 4 weeks based on recommended training
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <SkillProgressionChart progressions={developmentPlan.skill_progression} />
                        </CardContent>
                      </Card>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Card className="glass-card">
                          <CardHeader>
                            <CardTitle className="text-base">Current vs Target Skills</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FocusAreasRadar focusAreas={developmentPlan.focus_areas} />
                          </CardContent>
                        </Card>

                        <Card className="glass-card">
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-primary" />
                              Milestones
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {developmentPlan.skill_progression.map((prog) => (
                              <div key={prog.skill} className="space-y-2">
                                <p className="text-sm font-medium">{prog.skill}</p>
                                <div className="flex flex-wrap gap-1">
                                  {prog.milestones.map((milestone, idx) => (
                                    <Badge
                                      key={idx}
                                      variant={idx === 0 ? 'default' : 'outline'}
                                      className="text-xs"
                                    >
                                      {milestone}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="flex h-[300px] items-center justify-center">
                        <p className="text-muted-foreground">No development plan available</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Focus Areas Tab */}
                <TabsContent value="focus" className="space-y-4">
                  {developmentPlan ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {developmentPlan.focus_areas.map((area, idx) => (
                        <FocusAreaCard key={idx} area={area} />
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="flex h-[300px] items-center justify-center">
                        <p className="text-muted-foreground">Loading focus areas...</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Weekly Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                  {developmentPlan ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {developmentPlan.weekly_goals.map((goal) => (
                        <WeeklyGoalCard key={goal.week} goal={goal} isActive={goal.week === 1} />
                      ))}
                    </div>
                  ) : (
                    <Card className="glass-card">
                      <CardContent className="flex h-[300px] items-center justify-center">
                        <p className="text-muted-foreground">Loading weekly goals...</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Ghost Replay Tab */}
                <TabsContent value="ghost" className="space-y-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Ghost Replay - Mistake Analysis
                      </CardTitle>
                      <CardDescription>
                        Review mistakes with 3D motion visualization powered by HY-Motion 1.0
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {playerMistakes.length > 0 ? (
                        <div className="space-y-3">
                          {playerMistakes.map((mistake) => (
                            <motion.div
                              key={mistake.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <h4 className="font-semibold capitalize">
                                      {mistake.type.replace('_', ' ')}
                                    </h4>
                                    <Badge
                                      variant={
                                        mistake.severity > 0.7
                                          ? 'destructive'
                                          : mistake.severity > 0.5
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="text-xs"
                                    >
                                      {Math.round(mistake.severity * 100)}% severity
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {mistake.description}
                                  </p>
                                  <p className="text-xs text-primary">
                                    <strong>Recommendation:</strong> {mistake.recommendation}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="ml-4"
                                  onClick={() => {
                                    setSelectedMistake(mistake);
                                    setMotionDialogOpen(true);
                                  }}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  View Ghost
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            No mistakes detected for this player
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Mistakes will appear here after match analysis
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources" className="space-y-4">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Recommended VODs & Resources
                      </CardTitle>
                      <CardDescription>
                        Curated learning materials based on identified improvement areas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {developmentPlan ? (
                        <ul className="space-y-3">
                          {developmentPlan.recommended_vods.map((vod, idx) => (
                            <li key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                              <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center">
                                <BookOpen className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{vod}</p>
                                <p className="text-xs text-muted-foreground">Video analysis</p>
                              </div>
                              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-center py-8">Loading resources...</p>
                      )}
                    </CardContent>
                  </Card>

                  {_progressMetrics && (
                    <Card className="glass-card">
                      <CardHeader>
                        <CardTitle className="text-base">Current Progress Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 md:grid-cols-5">
                          {Object.entries(_progressMetrics).map(([key, value]) => (
                            <div key={key} className="text-center p-3 rounded-lg bg-muted/50">
                              <p className="text-lg font-bold text-primary">{Math.round((value as number) * 100)}%</p>
                              <p className="text-xs text-muted-foreground capitalize">{key}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card className="glass-card">
              <CardContent className="flex h-[400px] items-center justify-center">
                <p className="text-muted-foreground">Select a player to view development plan</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ghost Replay Motion Viewer Dialog */}
      <Dialog open={motionDialogOpen} onOpenChange={setMotionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Ghost Replay - {selectedMistake?.type.replace('_', ' ')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMistake && (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm mb-2">
                  <strong>Mistake:</strong> {selectedMistake.description}
                </p>
                <p className="text-xs text-primary">
                  <strong>Recommendation:</strong> {selectedMistake.recommendation}
                </p>
              </div>
            )}
            <MotionViewer />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
