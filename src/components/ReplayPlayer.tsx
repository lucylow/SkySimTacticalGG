import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReplayPlayerProps {
  matchId: string;
}

export default function ReplayPlayer({ matchId }: ReplayPlayerProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium">Replay Player</h3>
      <Card>
        <CardContent className="pt-4">
          <div className="h-64 bg-muted rounded flex items-center justify-center">
            <p className="text-muted-foreground">Match {matchId} replay</p>
          </div>
        </CardContent>
      </Card>
      <Button 
        variant="outline" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Scroll to top
      </Button>
    </div>
  );
}
