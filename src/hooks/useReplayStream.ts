// src/hooks/useReplayStream.ts
import { useEffect, useRef, useState, useCallback } from 'react';

export default function useReplayStream(streamUrl: string | null) {
  const [connected, setConnected] = useState(false);
  const [framesReceived, setFramesReceived] = useState<number>(0);
  const [events, setEvents] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!streamUrl) return;
    if (esRef.current) esRef.current.close();
    try {
      const es = new EventSource(streamUrl);
      esRef.current = es;
      es.onopen = () => setConnected(true);
      es.onmessage = (ev) => {
        // default messages may be small summary frames
        try {
          setFramesReceived((f) => f + 1);
          setEvents((prev) => [...prev, { type: 'message', data: ev.data }]);
        } catch (e) { /* ignore */ }
      };
      // typed events (frame is a summary event)
      es.addEventListener('frame', (ev) => {
        try {
          const data = JSON.parse(ev.data);
          setEvents((prev) => [...prev, { type: 'frame', data }]);
          setFramesReceived((f) => f + 1);
        } catch (e) {}
      });
      es.addEventListener('kill', (ev) => {
        try {
          setEvents((prev) => [...prev, { type: 'kill', data: JSON.parse(ev.data) }]);
        } catch (e) {}
      });
      es.addEventListener('ability', (ev) => {
        try {
          setEvents((prev) => [...prev, { type: 'ability', data: JSON.parse(ev.data) }]);
        } catch (e) {}
      });
      es.addEventListener('teamfight', (ev) => {
        try {
          setEvents((prev) => [...prev, { type: 'teamfight', data: JSON.parse(ev.data) }]);
        } catch (e) {}
      });
      es.addEventListener('done', (ev) => {
        setEvents((prev) => [...prev, { type: 'done', data: ev.data }]);
        if (esRef.current) { esRef.current.close(); setConnected(false); }
      });
      es.onerror = (err) => {
        console.warn('SSE error', err);
        setConnected(false);
        if (esRef.current) esRef.current.close();
      };
    } catch (e) {
      console.error('Failed to create EventSource', e);
    }
  }, [streamUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (esRef.current) esRef.current.close();
    };
  }, [connect]);

  return { connected, framesReceived, events };
}
