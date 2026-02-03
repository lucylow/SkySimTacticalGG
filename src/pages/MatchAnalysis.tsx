import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Gamepad2,
  Clock,
  Trophy,
  AlertTriangle,
  Play,
  Users,
  Brain,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MotionViewer } from '@/components/motion/MotionViewer';
import { WhatIfQuery } from '@/components/predictions/WhatIfQuery';
import { api } from '@/services/api';
import { backendApi } from '@/services/backendApi';
import type { Match } from '@/types';
import type { MacroReview } from '@/types/backend';

export const MatchAnalysis: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [motionDialogOpen, setMotionDialogOpen] = useState(false);
  const [_loading, setLoading] = useState(true);
  const [macroReview, setMacroReview] = useState<MacroReview | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  useEffect(() => {
    if (selectedMatch?.id) {
      loadMacroReview(selectedMatch.id);
    }
  }, [selectedMatch?.id]);

  const loadMatches = async () => {
    setLoading(false);
    try {
      const matchList = await api.fetchMatchList();
      setMatches(matchList);
      if (matchId) {
        const match = matchList.find((m) => m.id === matchId);
        setSelectedMatch(match || null);
      }
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMacroReview = async (matchId: string) => {
    try {
      const review = await backendApi.getMacroReview(matchId);
      setMacroReview(review);
    } catch (error) {
      console.error('Failed to load macro review:', error);
    }
  };

  // Sample round data for demo
  const winTypes = ['elimination', 'defuse', 'time', 'plant'] as const;
  const SampleRounds = Array.from({ length: 10 }, (_, i) => ({
    round_number: i + 1,
    winner: i % 3 === 0 ? 'Team Beta' : 'Team Alpha',
    win_type: winTypes[i % 4],
    events: [
      { timestamp: 15, type: 'kill', description: 'OXY killed ENEMY1' },
      { timestamp: 32, type: 'ability', description: 'SMOKE deployed controller ability' },
      { timestamp: 45, type: 'kill', description: 'NOVA killed ENEMY2' },
    ],
    mistakes: i % 2 === 0 ? [
      {
        id: `m${i}`,
        player_id: 'p1',
        player_name: 'OXY',
        type: 'Positioning',
        severity: 0.6,
        description: 'Exposed position during execute',
        recommendation: 'Use smoke cover before peeking',
      },
    ] : [],
  }));

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
          <h1 className="text-2xl font-bold">Match Analysis</h1>
          <p className="text-muted-foreground">
            Review matches and analyze performance
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Match List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matches.map((match) => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50 ${
                  selectedMatch?.id === match.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{match.map}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {match.score.join(' - ')}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium">
                  vs {match.team_b.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(match.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Match Details */}
        <div className="lg:col-span-3">
          {selectedMatch ? (
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                      <Gamepad2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>
                        {selectedMatch.team_a.name} vs {selectedMatch.team_b.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {selectedMatch.map} • {selectedMatch.duration} min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {selectedMatch.score.join(' - ')}
                    </p>
                    <Badge
                      variant={
                        selectedMatch.winner === selectedMatch.team_a.name
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {selectedMatch.winner === selectedMatch.team_a.name
                        ? 'Victory'
                        : 'Defeat'}
                    </Badge>
                    <div className="mt-3">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/app/assistant-coach/${selectedMatch.id}`}>
                          <Brain className="mr-2 h-4 w-4" />
                          Comprehensive Analysis
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="rounds" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="rounds">Rounds</TabsTrigger>
                    <TabsTrigger value="players">Players</TabsTrigger>
                    <TabsTrigger value="strategy">Strategy</TabsTrigger>
                    <TabsTrigger value="predictions">What-If</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="rounds" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Winner</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Issues</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {SampleRounds.map((round) => (
                          <TableRow key={round.round_number}>
                            <TableCell className="font-medium">
                              {round.round_number}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  round.winner === 'Team Alpha'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {round.winner}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">
                              {round.win_type}
                            </TableCell>
                            <TableCell>
                              {round.mistakes.length > 0 && (
                                <div className="flex items-center gap-1 text-amber-500">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>{round.mistakes.length}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setMotionDialogOpen(true)}
                              >
                                <Play className="mr-1 h-4 w-4" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="players" className="mt-4">
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Users className="mr-2 h-5 w-5" />
                      Player performance analysis coming soon
                    </div>
                  </TabsContent>

                  <TabsContent value="strategy" className="mt-4">
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Trophy className="mr-2 h-5 w-5" />
                      Strategy analysis coming soon
                    </div>
                  </TabsContent>

                  <TabsContent value="predictions" className="mt-4">
                    {selectedMatch?.id ? (
                      <WhatIfQuery
                        matchId={selectedMatch.id}
                        currentReview={macroReview || undefined}
                      />
                    ) : (
                      <div className="flex items-center justify-center py-12 text-muted-foreground">
                        <Trophy className="mr-2 h-5 w-5" />
                        Select a match to run predictions
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="stats" className="mt-4">
                    <div className="flex items-center justify-center py-12 text-muted-foreground">
                      <Clock className="mr-2 h-5 w-5" />
                      Detailed statistics coming soon
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card">
              <CardContent className="flex h-[400px] items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Gamepad2 className="mx-auto mb-4 h-12 w-12" />
                  <p>Select a match to view analysis</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Motion Viewer Dialog */}
      <Dialog open={motionDialogOpen} onOpenChange={setMotionDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Motion Analysis Viewer</DialogTitle>
          </DialogHeader>
          <MotionViewer />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

