import { useEffect, useRef, useState, useCallback } from 'react';

type AgentEvent = { type: string; data: any };

export default function useAgentStream(url: string | null) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (!url) return;
    if (esRef.current) esRef.current.close();
    const es = new EventSource(url);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (ev) => {
      // default message type
      setEvents((prev) => [...prev, { type: 'message', data: JSON.parse(ev.data) }]);
    };
    es.addEventListener('token', (ev: MessageEvent) => {
      setEvents((prev) => [...prev, { type: 'token', data: JSON.parse(ev.data) }]);
    });
    es.addEventListener('tool', (ev: MessageEvent) => {
      setEvents((prev) => [...prev, { type: 'tool', data: JSON.parse(ev.data) }]);
    });
    es.addEventListener('done', (ev: MessageEvent) => {
      setEvents((prev) => [...prev, { type: 'done', data: JSON.parse(ev.data) }]);
    });
    es.onerror = (e) => {
      console.warn('SSE error', e);
      setConnected(false);
      if (esRef.current) esRef.current.close();
      // reconnect with jitter
      reconnectRef.current = window.setTimeout(connect, 1000 + Math.random() * 1000);
    };
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  const reset = useCallback(() => {
    setEvents([]);
  }, []);

  return { connected, events, reset };
}
