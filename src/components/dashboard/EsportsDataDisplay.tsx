import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Gamepad2, MapPin, Sword } from 'lucide-react';

interface ValTeam {
  id: string;
  name: string;
  slug: string;
  region: string | null;
}

interface ValMatch {
  id: string;
  tournament: string | null;
  stage: string | null;
  status: string | null;
  start_ts: string | null;
  team_a_id: string | null;
  team_b_id: string | null;
}

interface ValPlayer {
  id: string;
  handle: string;
  primary_role: string | null;
  team_id: string | null;
}

interface GridMatch {
  id: string;
  provider: string;
  provider_match_id: string;
  map_name: string | null;
  match_ts: string | null;
}

export function EsportsDataDisplay() {
  const [valTeams, setValTeams] = useState<ValTeam[]>([]);
  const [valMatches, setValMatches] = useState<ValMatch[]>([]);
  const [valPlayers, setValPlayers] = useState<ValPlayer[]>([]);
  const [gridMatches, setGridMatches] = useState<GridMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch VALORANT and GRID data
        const [vTeamsRes, vMatchesRes, vPlayersRes, gridRes] = await Promise.all([
          supabase.from('val_teams').select('*').limit(10),
          supabase.from('val_matches').select('*').limit(10),
          supabase.from('val_players').select('*').limit(10),
          supabase.from('grid_matches').select('*').limit(10),
        ]);

        setValTeams(vTeamsRes.data || []);
        setValMatches(vMatchesRes.data || []);
        setValPlayers(vPlayersRes.data || []);
        setGridMatches(gridRes.data || []);
      } catch (err) {
        console.error('Data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasData = valTeams.length > 0 || valMatches.length > 0 || valPlayers.length > 0 || gridMatches.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Esports Data (GRID & Riot API)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">VALORANT Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valTeams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">VALORANT Matches</CardTitle>
            <Sword className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valMatches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">VALORANT Players</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{valPlayers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GRID Matches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gridMatches.length}</div>
          </CardContent>
        </Card>
      </div>

      {!hasData && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No esports data found in the database.</p>
            <p className="text-sm text-muted-foreground">
              Ingest VALORANT match data to see more.
            </p>
          </CardContent>
        </Card>
      )}

      {/* VALORANT Section */}
      {valTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>VALORANT Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {valTeams.map((team) => (
                <Badge key={team.id} variant="secondary">
                  {team.name} {team.region && `(${team.region})`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VALORANT Players List */}
      {valPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>VALORANT Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {valPlayers.map((player) => (
                <Badge key={player.id} variant="outline">
                  {player.handle} {player.primary_role && `- ${player.primary_role}`}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* VALORANT Matches List */}
      {valMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent VALORANT Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {valMatches.map((match) => (
                <div key={match.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">{match.tournament || 'Unknown Tournament'}</span>
                  <Badge variant="outline">{match.status || 'unknown'}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}