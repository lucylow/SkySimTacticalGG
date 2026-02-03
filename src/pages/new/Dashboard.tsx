import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

export function Dashboard() {
  const [matches, setMatches] = useState<{ id: string; map_name: string | null; match_ts: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('grid_matches')
        .select('id, map_name, match_ts')
        .order('match_ts', { ascending: false })
        .limit(5);
      
      if (!error && data) {
        setMatches(data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Matches (GRID)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : matches.length > 0 ? (
              <ul className="space-y-2">
                {matches.map((m) => (
                  <li key={m.id} className="text-sm">
                    {m.map_name || 'Unknown Map'} - {m.match_ts ? new Date(m.match_ts).toLocaleDateString() : 'No date'}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No matches found</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
