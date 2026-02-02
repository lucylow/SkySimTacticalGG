// React hook for match state

import { useEffect, useState } from 'react';
import { matchStateEngine, eventBus } from '@/services/grid';
import type { MatchState } from '@/types/grid';

export function useMatchState(matchId: string) {
  const [state, setState] = useState<MatchState | undefined>(
    matchStateEngine.getState(matchId)
  );

  useEffect(() => {
    // Subscribe to events to update state
    const unsubscribe = eventBus.subscribeCanonical((event) => {
      if (event.match_id === matchId) {
        const newState = matchStateEngine.processEvent(event);
        setState(newState);
      }
    });

    // Initial state
    const currentState = matchStateEngine.getState(matchId);
    if (currentState) {
      setState(currentState);
    }

    return unsubscribe;
  }, [matchId]);

  return state;
}


