import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { fetchValorantMatches as fetchSampleValorantMatches } from '@/services/SampleApi';

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
      try {
        const { data, error: fetchError } = await supabase
          .from('val_matches')
          .select('id, tournament, stage, start_ts, status')
          .order('start_ts', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setMatches(data);
        } else {
          // Fallback to Sample API if no data
          const Sample = await fetchSampleValorantMatches().catch(() => [] as any[]);
          if (Sample && Sample.length > 0) {
            const mapped = Sample.map((m: any) => ({
              id: m.id,
              tournament: m.title ?? 'Sample Tournament',
              stage: m.map ?? 'Sample',
              start_ts: m.startedAt ? new Date(m.startedAt).toISOString() : null,
              status: 'Sample'
            }));
            setMatches(mapped);
          } else {
            setMatches([]);
          }
        }
      } catch (e: any) {
        // On error, try Sample fallback
        try {
          const Sample = await fetchSampleValorantMatches();
          const mapped = Sample.map((m: any) => ({
            id: m.id,
            tournament: m.title ?? 'Sample Tournament',
            stage: m.map ?? 'Sample',
            start_ts: m.startedAt ? new Date(m.startedAt).toISOString() : null,
            status: 'Sample'
          }));
          setMatches(mapped);
        } catch (SampleErr: any) {
          setError(e?.message || 'Failed to load Valorant matches');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  if (error && matches.length === 0) {
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

      {/* Valorant visual banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <img
          src="https://images.unsplash.com/photo-1598126215452-6d6a0ae73954?q=80&w=1200&auto=format&fit=crop"
          alt="Valorant gameplay scene"
          className="w-full h-40 object-cover rounded-lg border"
          loading="lazy"
        />
        <img
          src="https://images.unsplash.com/photo-1606117331172-e7aa3c2d6b5b?q=80&w=1200&auto=format&fit=crop"
          alt="Valorant esports stage"
          className="w-full h-40 object-cover rounded-lg border hidden sm:block"
          loading="lazy"
        />
        <img
          src="https://images.unsplash.com/photo-1571172964533-d2d13f662b3a?q=80&w=1200&auto=format&fit=crop"
          alt="FPS action aesthetic"
          className="w-full h-40 object-cover rounded-lg border hidden sm:block"
          loading="lazy"
        />
      </div>
      
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

