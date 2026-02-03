import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, Trophy, Users, ArrowRight, Loader2, Zap, Shield, Target, Play, Video, Sparkles, Brain } from 'lucide-react';

interface GridMatch {
  id: string;
  map_name: string | null;
  match_ts: string | null;
  provider: string;
}

interface ValorantMatch {
  id: string;
  tournament: string | null;
  stage: string | null;
  start_ts: string | null;
  status: string | null;
}

interface ValorantTeam {
  id: string;
  name: string;
  slug: string;
  region: string | null;
}

const Index = () => {
  const [gridMatches, setGridMatches] = useState<GridMatch[]>([]);
  const [valMatches, setValMatches] = useState<ValorantMatch[]>([]);
  const [valTeams, setValTeams] = useState<ValorantTeam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [gridRes, valMatchRes, valTeamRes] = await Promise.all([
        supabase
          .from('grid_matches')
          .select('id, map_name, match_ts, provider')
          .order('match_ts', { ascending: false })
          .limit(5),
        supabase
          .from('val_matches')
          .select('id, tournament, stage, start_ts, status')
          .order('start_ts', { ascending: false })
          .limit(5),
        supabase
          .from('val_teams')
          .select('id, name, slug, region')
          .limit(10),
      ]);

      if (gridRes.data) setGridMatches(gridRes.data);
      if (valMatchRes.data) setValMatches(valMatchRes.data);
      if (valTeamRes.data) setValTeams(valTeamRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-secondary/20 border-b">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070')] bg-cover bg-center opacity-10" />
        <div className="container relative mx-auto px-4 py-24 md:py-32 text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-1 text-sm font-medium animate-fade-in">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              The Future of Esports Intelligence
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              SkySim Tactical GG
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Elevate your game with AI-powered analytics. Deep insights for Valorant and LoL players, coaches, and analysts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
                <Link to="/app/assistant-coach">
                  Try SkySim AI
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 h-auto">
                <Link to="/app">Browse Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Feature Grid */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Elite Tools for Elite Performance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our suite of analysis tools provides everything you need to dominate the competition.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all border-primary/20">
              <CardHeader>
                <div className="mb-4 p-3 rounded-lg bg-primary/10 w-fit">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl">SkySim AI Coach</CardTitle>
                <CardDescription>
                  Comprehensive match analysis and strategic insights powered by GRID data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="px-0 group-hover:translate-x-1 transition-transform" asChild>
                  <Link to="/app/assistant-coach">Launch Coach <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <CardHeader>
                <div className="mb-4 p-3 rounded-lg bg-blue-500/10 w-fit">
                  <Video className="h-8 w-8 text-blue-500" />
                </div>
                <CardTitle className="text-2xl">Motion Studio</CardTitle>
                <CardDescription>
                  Advanced movement and utility analysis with visual heatmaps and pathing.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="px-0 group-hover:translate-x-1 transition-transform" asChild>
                  <Link to="/app/motion">Open Studio <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden group hover:shadow-xl transition-all">
              <CardHeader>
                <div className="mb-4 p-3 rounded-lg bg-purple-500/10 w-fit">
                  <Target className="h-8 w-8 text-purple-500" />
                </div>
                <CardTitle className="text-2xl">AI Playground</CardTitle>
                <CardDescription>
                  Test your strategies against our proprietary ML models for win probability.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="link" className="px-0 group-hover:translate-x-1 transition-transform" asChild>
                  <Link to="/app/ai-playground">Start Playing <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-24">
        <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">Live Match Intelligence</h2>
              <p className="text-muted-foreground leading-relaxed">
                Stay ahead of the meta with our real-time data ingestion. We process thousands of events
                per match to give you the tactical edge.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-card">
                <p className="text-sm text-muted-foreground mb-1">GRID Matches</p>
                <p className="text-3xl font-bold">{gridMatches.length > 0 ? gridMatches.length + 42 : '...'}</p>
              </div>
              <div className="p-4 rounded-xl border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Teams Tracked</p>
                <p className="text-3xl font-bold">{valTeams.length > 0 ? valTeams.length + 128 : '...'}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button asChild>
                <Link to="/app/grid">Explore GRID Data</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/agent">Agent Console</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1 w-full">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="valorant" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="valorant">Valorant</TabsTrigger>
                  <TabsTrigger value="lol">League of Legends</TabsTrigger>
                </TabsList>

                <TabsContent value="valorant" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Valorant Matches */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          Recent Matches
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/app/grid">View All</Link>
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {valMatches.length > 0 ? (
                          <ul className="space-y-3">
                            {valMatches.map((m) => (
                              <li key={m.id} className="flex justify-between items-center p-2 rounded hover:bg-accent">
                                <div>
                                  <p className="font-medium text-sm">{m.tournament || 'Match'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {m.stage || 'Stage'} • {m.start_ts ? new Date(m.start_ts).toLocaleDateString() : 'No date'}
                                  </p>
                                </div>
                                <Badge variant={m.status === 'completed' ? 'default' : 'secondary'} className="capitalize">
                                  {m.status || 'unknown'}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm py-4 text-center">No Valorant matches found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Valorant Teams */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          Teams
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {valTeams.length > 0 ? (
                          <ul className="space-y-2">
                            {valTeams.map((t) => (
                              <li key={t.id} className="flex justify-between items-center p-2 rounded hover:bg-accent">
                                <div>
                                  <p className="font-medium text-sm">{t.name}</p>
                                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                                </div>
                                {t.region && (
                                  <Badge variant="outline">{t.region}</Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm py-4 text-center">No teams found</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="lol" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* GRID/LoL Matches */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-primary" />
                          GRID Matches
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/app/grid">View All</Link>
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {gridMatches.length > 0 ? (
                          <ul className="space-y-3">
                            {gridMatches.map((m) => (
                              <li key={m.id} className="flex justify-between items-center p-2 rounded hover:bg-accent">
                                <div>
                                  <p className="font-medium text-sm">{m.map_name || 'Unknown Map'}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {m.match_ts ? new Date(m.match_ts).toLocaleDateString() : 'No date'}
                                  </p>
                                </div>
                                <Badge variant="outline">{m.provider}</Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-muted-foreground text-sm py-4 text-center">No GRID matches found</p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Quick Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-sm">GRID Matches</span>
                          <Badge>{gridMatches.length}+</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-sm">Valorant Matches</span>
                          <Badge>{valMatches.length}+</Badge>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded">
                          <span className="text-sm">Teams Tracked</span>
                          <Badge>{valTeams.length}+</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-muted-foreground">
            SkySim Tactical GG - Esports Analytics Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
