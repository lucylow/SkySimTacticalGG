import React from 'react';
import { Clock, CircleDot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgent } from '@/context/AgentContext';

export const Timeline: React.FC = () => {
  const { timeline } = useAgent();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Timeline
      </h3>
      
      <ScrollArea className="h-[200px]">
        {timeline.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-xs">No events yet</p>
          </div>
        ) : (
          <div className="relative pl-4 space-y-4">
            {/* Vertical line */}
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
            
            {timeline.map((event, idx) => (
              <div key={event.id} className="relative flex gap-3">
                <CircleDot className={`w-4 h-4 shrink-0 ${idx === 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="min-w-0 pb-2">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.detail}</p>
                  )}
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
