// Event Timeline Component - Visualizes canonical events

import { useGridEvents } from '@/hooks/useGridEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import type { CanonicalEvent } from '@/types/grid';

interface EventTimelineProps {
  matchId?: string;
}

const eventTypeColors: Record<string, string> = {
  MATCH_START: 'bg-blue-500',
  MAP_START: 'bg-purple-500',
  ROUND_START: 'bg-green-500',
  KILL: 'bg-red-500',
  ASSIST: 'bg-orange-500',
  OBJECTIVE: 'bg-yellow-500',
  ROUND_END: 'bg-gray-500',
  MAP_END: 'bg-indigo-500',
  MATCH_END: 'bg-pink-500',
};

export function EventTimeline({ matchId }: EventTimelineProps) {
  const { events, isConnected } = useGridEvents(matchId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Event Timeline</span>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No events yet. Start ingestion to see events.
              </p>
            ) : (
              events.map((event) => (
                <EventItem key={event.event_id} event={event} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function EventItem({ event }: { event: CanonicalEvent }) {
  const color = eventTypeColors[event.event_type] || 'bg-gray-500';
  const timestamp = new Date(event.timestamp);

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className={`w-2 h-2 rounded-full mt-2 ${color}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {event.event_type}
          </Badge>
          {event.round && (
            <span className="text-xs text-muted-foreground">Round {event.round}</span>
          )}
          {event.team && (
            <Badge variant="secondary" className="text-xs">
              {event.team}
            </Badge>
          )}
        </div>
        <div className="mt-1 text-sm">
          {event.actor && (
            <span className="font-medium">{event.actor}</span>
          )}
          {event.target && (
            <>
              {' → '}
              <span className="font-medium">{event.target}</span>
            </>
          )}
        </div>
        {Object.keys(event.payload).length > 0 && (
          <div className="mt-1 text-xs text-muted-foreground">
            {JSON.stringify(event.payload, null, 2).slice(0, 100)}
            {JSON.stringify(event.payload).length > 100 && '...'}
          </div>
        )}
        <div className="mt-1 text-xs text-muted-foreground">
          {format(timestamp, 'HH:mm:ss.SSS')}
        </div>
      </div>
    </div>
  );
}


