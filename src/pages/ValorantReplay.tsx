import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ValorantReplay() {
  const { matchId } = useParams();
  const [playing, setPlaying] = useState(false);
  const [framesReceived, setFramesReceived] = useState(0);

  // Simple frame counter simulation
  const handleStart = () => {
    setPlaying(true);
    const interval = setInterval(() => {
      setFramesReceived(prev => prev + 1);
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      setPlaying(false);
    }, 5000);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Valorant Replay: {matchId || 'Unknown'}</h1>
      
      <div className="flex gap-2">
        <Button onClick={handleStart} disabled={playing}>
          Start
        </Button>
        <Button variant="outline" onClick={() => setPlaying(false)} disabled={!playing}>
          Stop
        </Button>
      </div>

      <Card>
        <CardContent className="py-4 space-y-2">
          <p>Connected: {String(playing)}</p>
          <p>Frames received: {framesReceived}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <div className="max-h-96 overflow-y-auto bg-muted p-2 rounded text-xs font-mono">
            <p className="text-muted-foreground">Replay data will appear here...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
