import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface ValorantMatch {
  id: string;
  tournament: string | null;
  stage: string | null;
  start_ts: string | null;
  status: string | null;
}

export default function ValorantMatches() {
  const [matches, setMatches] = useState<ValorantMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      const { data, error: fetchError } = await supabase
        .from('val_matches')
        .select('id, tournament, stage, start_ts, status')
        .order('start_ts', { ascending: false })
        .limit(20);

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setMatches(data);
      }
      setLoading(false);
    }
    fetchMatches();
  }, []);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Failed to load matches: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Valorant Matches</h1>
      
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No Valorant matches found in database</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Card key={m.id} className="hover:bg-accent/50 transition-colors">
              <Link to={`/match/valorant/${m.id}`}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.tournament || 'Unknown Tournament'}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.stage || 'Match'} • {m.start_ts ? new Date(m.start_ts).toLocaleString() : 'No date'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">{m.status || 'unknown'}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
