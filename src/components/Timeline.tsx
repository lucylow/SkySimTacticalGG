import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelineProps {
  matchId: string;
}

export default function Timeline(_props: TimelineProps) {
  // Stubbed sample events — replace with API call in real use
  const events = Array.from({ length: 60 }).map((_, i) => ({ 
    id: i, 
    ts: i * 15, 
    text: `Event ${i}` 
  }));

  return (
    <ScrollArea className="h-[600px]">
      <ul className="space-y-1">
        {events.map(ev => (
          <li key={ev.id} className="flex justify-between py-1 px-2 hover:bg-accent rounded text-sm">
            <span>{ev.text}</span>
            <span className="text-muted-foreground">t={ev.ts}s</span>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
