import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface AgentEvent {
  type: string;
  data: unknown;
}

// Simple hook for agent stream
function useAgentStream(url: string | null) {
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [connected, setConnected] = useState(false);

  const reset = () => {
    setEvents([]);
    setConnected(false);
  };

  // Placeholder - in production this would connect to SSE
  if (url && !connected) {
    setConnected(true);
    // Sample event for demo
    setTimeout(() => {
      setEvents([{ type: 'status', data: { message: 'Agent initialized' } }]);
    }, 500);
  }

  return { events, connected, reset };
}

function startAgentStreamUrl(prompt: string): string {
  return `/api/agent/stream?prompt=${encodeURIComponent(prompt)}`;
}

export function AgentConsole() {
  const [prompt, setPrompt] = useState('Analyze match: test');
  const [url, setUrl] = useState<string | null>(null);
  const { events, connected, reset } = useAgentStream(url);

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agent Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea 
            value={prompt} 
            onChange={(e) => setPrompt(e.target.value)} 
            rows={2}
            placeholder="Try: [Valorant] Predict their A-site hit timing next round • [LoL] Identify our weakest objective setups this game"
          />
          <div className="flex gap-2">
            <Button onClick={() => { reset(); setUrl(startAgentStreamUrl(prompt)); }}>
              Start Stream
            </Button>
            <Button variant="outline" onClick={() => { setUrl(null); reset(); }}>
              Stop
            </Button>
          </div>
          <Badge variant={connected ? "default" : "secondary"}>
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {events.map((ev, i) => (
          <Card key={i}>
            <CardContent className="py-3">
              <p className="font-medium text-sm">{ev.type}</p>
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap mt-1">
                {JSON.stringify(ev.data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default AgentConsole;

