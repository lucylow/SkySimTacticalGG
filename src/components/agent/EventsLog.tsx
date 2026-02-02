import React from 'react';
import { Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgent } from '@/context/AgentContext';
import { cn } from '@/lib/utils';

export const EventsLog: React.FC = () => {
  const { eventsLog, isRunning } = useAgent();
  
  const getEventColor = (type: string) => {
    switch (type) {
      case 'token': return 'text-green-400';
      case 'tool': return 'text-yellow-400';
      case 'tool_result': return 'text-blue-400';
      case 'timeline': return 'text-purple-400';
      case 'meta': return 'text-gray-400';
      case 'done': return 'text-emerald-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Events Log
        </h3>
        {isRunning && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-green-400">Live</span>
          </span>
        )}
      </div>
      
      <ScrollArea className="h-[180px]">
        <div className="space-y-1 font-mono text-xs">
          {eventsLog.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No events captured
            </p>
          ) : (
            eventsLog.slice(-20).map((event, idx) => (
              <div 
                key={idx}
                className="flex gap-2 py-1 px-2 rounded hover:bg-muted/30 transition-colors"
              >
                <span className={cn('shrink-0 w-20', getEventColor(event.type))}>
                  [{event.type}]
                </span>
                <span className="text-muted-foreground truncate">
                  {event.type === 'token' 
                    ? `"${event.data.text}"` 
                    : JSON.stringify(event.data).slice(0, 60)}
                </span>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
