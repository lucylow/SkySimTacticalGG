import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { api } from '@/services/api';

interface LolMatch {
  id: string;
  title?: string | null;
  region?: string | null;
  patch?: string | null;
  match_ts?: string | null;
}

export default function LolMatches() {
  const [matches, setMatches] = useState<LolMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const { data, error: fetchError } = await supabase
          .from('lol_matches' as any)
          .select('id, region, patch, match_ts')
          .order('match_ts', { ascending: false })
          .limit(20);

        if (fetchError) throw fetchError;

        if (data && data.length > 0) {
          setMatches(data);
        } else {
          // Fallback to Sample API service
          const Sample = await api.fetchLoLMatches();
          const mapped = Sample.map((m: any) => ({
            id: m.id,
            title: m.title ?? 'Sample LoL Match',
            region: (m.region as string) ?? 'Sample',
            patch: (m.patch as string) ?? null,
            match_ts: m.startTime ? new Date(m.startTime).toISOString() : null,
          }));
          setMatches(mapped);
        }
      } catch (e: any) {
        try {
          const Sample = await api.fetchLoLMatches();
          const mapped = Sample.map((m: any) => ({
            id: m.id,
            title: m.title ?? 'Sample LoL Match',
            region: (m.region as string) ?? 'Sample',
            patch: (m.patch as string) ?? null,
            match_ts: m.startTime ? new Date(m.startTime).toISOString() : null,
          }));
          setMatches(mapped);
        } catch (SampleErr: any) {
          setError(e?.message || 'Failed to load LoL matches');
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
      <h1 className="text-2xl font-bold">League of Legends Matches</h1>

      {/* League of Legends visual banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <img
          src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Ahri_0.jpg"
          alt="League of Legends - Ahri splash art"
          className="w-full h-40 object-cover rounded-lg border"
          loading="lazy"
        />
        <img
          src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Garen_0.jpg"
          alt="League of Legends - Garen splash art"
          className="w-full h-40 object-cover rounded-lg border hidden sm:block"
          loading="lazy"
        />
        <img
          src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Lux_0.jpg"
          alt="League of Legends - Lux splash art"
          className="w-full h-40 object-cover rounded-lg border hidden sm:block"
          loading="lazy"
        />
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No LoL matches found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {matches.map((m) => (
            <Card key={m.id} className="hover:bg-accent/50 transition-colors">
              <Link to={`/match/lol/${m.id}`}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.title || `${m.region || 'Region'} • Patch ${m.patch || 'N/A'}`}</p>
                      <p className="text-sm text-muted-foreground">
                        {m.match_ts ? new Date(m.match_ts).toLocaleString() : 'No date'}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground capitalize">{m.region || 'Sample'}</span>
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

