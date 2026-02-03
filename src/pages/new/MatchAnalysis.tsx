import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function MatchAnalysis() {
  const { matchId } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Match Analysis: {matchId || 'Demo'}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Replay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded flex items-center justify-center">
              <p className="text-muted-foreground">Replay player placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {Array.from({ length: 10 }).map((_, i) => (
                <li key={i} className="flex justify-between">
                  <span>Event {i + 1}</span>
                  <span className="text-muted-foreground">{i * 15}s</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default MatchAnalysis;
