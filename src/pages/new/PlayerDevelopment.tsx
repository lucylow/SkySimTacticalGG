import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function PlayerDevelopment() {
  const { playerId } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Player Development: {playerId || 'Unknown'}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Detailed player statistics and development tracking would be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlayerDevelopment;
