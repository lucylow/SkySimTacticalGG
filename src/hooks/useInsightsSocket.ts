// React hook for consuming insights via WebSocket
import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import type { PersonalizedInsight } from '@/types/insights';

import { config } from '@/lib/config';

export function useInsightsSocket() {
  const [insights, setInsights] = useState<PersonalizedInsight[]>([]);
  
  // Build WebSocket URL from config (origin only) and append path
  const wsUrl = `${config.wsBaseUrl}/ws/insights`;
  
  const { isConnected } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      const msg = message as { type?: string; data?: PersonalizedInsight };
      // Handle different message types
      if (msg.type === 'connected') {
        console.log('Connected to insights stream');
        return;
      }
      if (msg.type === 'ping') {
        return; // Ignore ping messages
      }
      // Handle actual insight data
      if (msg.data) {
        setInsights((old) => {
          // Avoid duplicates
          const exists = old.some((i) => i.id === msg.data?.id);
          if (exists) {
            return old;
          }
          return [msg.data as PersonalizedInsight, ...old].slice(0, 200); // Keep last 200
        });
      }
    },
    onConnect: () => {
      console.log('Insights WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Insights WebSocket disconnected');
    },
    autoConnect: true,
  });

  // Also fetch initial insights from API
  useEffect(() => {
    const fetchInitialInsights = async () => {
      try {
        const response = await fetch('/api/v1/insights?limit=50');
        if (response.ok) {
          const data = await response.json();
          setInsights(data);
        }
      } catch (error) {
        console.error('Failed to fetch initial insights:', error);
      }
    };
    
    fetchInitialInsights();
  }, []);

  const clearInsights = useCallback(() => {
    setInsights([]);
  }, []);

  return {
    insights,
    isConnected,
    clearInsights,
  };
}