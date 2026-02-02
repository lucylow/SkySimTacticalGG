// React hook for consuming AI agent signals

import { useEffect, useState, useCallback } from 'react';
import { eventBus } from '@/services/grid';
import type { AgentSignal } from '@/types/grid';

export function useAgentSignals(matchId?: string) {
  const [signals, setSignals] = useState<AgentSignal[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    setIsConnected(true);

    const unsubscribe = eventBus.subscribeSignals((signal) => {
      if (!matchId || signal.match_id === matchId) {
        setSignals((prev) => {
          // Avoid duplicates
          if (prev.some((s) => s.id === signal.id)) {
            return prev;
          }
          return [...prev, signal];
        });
      }
    });

    // Load existing signals
    if (matchId) {
      const existing = eventBus.getMatchSignals(matchId);
      setSignals(existing);
    } else {
      const allSignals = eventBus.getAllSignals();
      setSignals(allSignals);
    }

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [matchId]);

  const clearSignals = useCallback(() => {
    setSignals([]);
  }, []);

  return {
    signals,
    isConnected,
    clearSignals,
  };
}


