// src/mocks/replaySessionPlayer.ts - Client-side session replay utility
import { sseReplayEvents, extendedReplayEvents } from './sseReplayEvents';
import type { AgentEvent } from '@/types/agent';

export type ReplayOptions = {
  speed?: number;           // Playback speed multiplier (default: 1.0)
  useExtended?: boolean;    // Use extended replay with more tools
  onComplete?: () => void;  // Callback when replay finishes
};

/**
 * Playback pre-recorded SSE events with realistic timing.
 * Returns a cancel function to stop playback.
 */
export function playReplay(
  onEvent: (ev: AgentEvent) => void,
  options: ReplayOptions = {}
): () => void {
  const { speed = 1.0, useExtended = false, onComplete } = options;
  const events = useExtended ? extendedReplayEvents : sseReplayEvents;
  
  let cancelled = false;

  const getDelay = (ev: AgentEvent): number => {
    switch (ev.type) {
      case 'token': return 80 + Math.random() * 60;
      case 'tool': return 250 + Math.random() * 150;
      case 'tool_result': return 500 + Math.random() * 300;
      case 'timeline': return 200 + Math.random() * 100;
      case 'meta': return 100;
      case 'done': return 100;
      default: return 150;
    }
  };

  (async () => {
    for (const ev of events) {
      if (cancelled) break;
      
      onEvent(ev);
      
      const delay = getDelay(ev) / Math.max(0.2, speed);
      await new Promise(r => setTimeout(r, delay));
    }
    
    if (!cancelled && onComplete) {
      onComplete();
    }
  })();

  return () => { cancelled = true; };
}

/**
 * Replay a specific recorded session with its messages.
 */
export function replaySession(
  session: { messages: Array<{ role: string; text: string; meta?: unknown }> },
  onEvent: (ev: AgentEvent) => void,
  speed = 1.0
): () => void {
  let cancelled = false;

  (async () => {
    onEvent({ type: 'meta', data: { sessionId: 'replay', ts: new Date().toISOString() } });

    for (const msg of session.messages) {
      if (cancelled) break;

      if (msg.role === 'assistant') {
        // Simulate token streaming for assistant messages
        const words = msg.text.split(' ');
        for (const word of words) {
          if (cancelled) break;
          onEvent({ type: 'token', data: { text: word + ' ' } });
          await new Promise(r => setTimeout(r, (60 + Math.random() * 40) / speed));
        }

        // Check for tool call in meta
        if (msg.meta && typeof msg.meta === 'object' && 'tool' in msg.meta) {
          const meta = msg.meta as { tool: string; args?: Record<string, unknown> };
          onEvent({ type: 'tool', data: { tool: meta.tool, args: meta.args } });
          await new Promise(r => setTimeout(r, 300 / speed));
        }
      } else if (msg.role === 'tool') {
        const meta = msg.meta as { result?: unknown } | undefined;
        onEvent({ 
          type: 'tool_result', 
          data: { 
            tool: 'unknown', 
            result: meta?.result || msg.text 
          } 
        });
        await new Promise(r => setTimeout(r, 200 / speed));
      }

      await new Promise(r => setTimeout(r, 100 / speed));
    }

    if (!cancelled) {
      onEvent({ type: 'done', data: { summary: 'Session replay complete' } });
    }
  })();

  return () => { cancelled = true; };
}

/**
 * Create a controlled replay that can be paused/resumed.
 */
export function createControllableReplay(
  onEvent: (ev: AgentEvent) => void,
  options: ReplayOptions = {}
) {
  let cancel: (() => void) | null = null;
  let isPaused = false;
  let currentIndex = 0;
  const events = options.useExtended ? extendedReplayEvents : sseReplayEvents;

  const play = () => {
    if (cancel) return;
    isPaused = false;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let localIndex = 0;

    cancel = playReplay(
      (ev) => {
        if (!isPaused) {
          currentIndex++;
          localIndex++;
          onEvent(ev);
        }
      },
      {
        ...options,
        onComplete: () => {
          cancel = null;
          options.onComplete?.();
        },
      }
    );
  };

  const pause = () => {
    isPaused = true;
    if (cancel) {
      cancel();
      cancel = null;
    }
  };

  const stop = () => {
    pause();
    currentIndex = 0;
  };

  const getProgress = () => ({
    current: currentIndex,
    total: events.length,
    percent: (currentIndex / events.length) * 100,
  });

  return { play, pause, stop, getProgress, isPlaying: () => cancel !== null };
}
