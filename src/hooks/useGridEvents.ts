// React hook for consuming GRID canonical events

import { useEffect, useState, useCallback } from 'react';
import { eventBus } from '@/services/grid';
import type { CanonicalEvent } from '@/types/grid';

export function useGridEvents(matchId?: string) {
  const [events, setEvents] = useState<CanonicalEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);

    const unsubscribe = eventBus.subscribeCanonical((event) => {
      if (!matchId || event.match_id === matchId) {
        setEvents((prev) => [...prev, event]);
      }
    });

    // Load existing events
    if (matchId) {
      const existing = eventBus.getMatchEvents(matchId);
      setEvents(existing);
    } else {
      const allEvents = eventBus.getAllCanonicalEvents();
      setEvents(allEvents);
    }

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [matchId]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    isConnected,
    clearEvents,
  };
}


