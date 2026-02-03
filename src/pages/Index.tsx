import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, Trophy, Users, ArrowRight, Loader2 } from 'lucide-react';

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
      <header className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4">
              <Gamepad2 className="w-3 h-3 mr-1" />
              Esports Analytics Platform
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              SkySim Tactical GG
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Advanced esports analytics for Valorant and League of Legends. 
              Real-time match data, team insights, and strategic analysis powered by AI.
            </p>
            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link to="/app">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/app/grid">GRID Data</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
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

        {/* Navigation Cards */}
        <div className="grid gap-4 md:grid-cols-3 mt-12">
          <Card className="hover:border-primary/50 transition-colors">
            <Link to="/app">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Dashboard</h3>
                <p className="text-sm text-muted-foreground">View overall analytics and insights</p>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover:border-primary/50 transition-colors">
            <Link to="/app/grid">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">GRID Data</h3>
                <p className="text-sm text-muted-foreground">Explore raw esports match data</p>
              </CardContent>
            </Link>
          </Card>
          <Card className="hover:border-primary/50 transition-colors">
            <Link to="/agent">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Agent Console</h3>
                <p className="text-sm text-muted-foreground">AI-powered analysis tools</p>
              </CardContent>
            </Link>
          </Card>
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
