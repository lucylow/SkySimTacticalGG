import { useEffect, useRef, useState, useCallback } from 'react';
import type { WebSocketMessage } from '@/types/api';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxRetries?: number;
  autoConnect?: boolean;
  protocols?: string | string[];
}

export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 5000,
    maxRetries = 5,
    autoConnect = true,
    protocols,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [messageHistory, setMessageHistory] = useState<WebSocketMessage[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const shouldReconnectRef = useRef(true);
  const messageQueueRef = useRef<unknown[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    if (!shouldReconnectRef.current) {
      return;
    }

    try {
      setConnectionState('connecting');
      const ws = new WebSocket(url, protocols);

      ws.onopen = () => {
        console.log('WebSocket connected:', url);
        setIsConnected(true);
        setConnectionState('connected');
        setRetryCount(0);
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const queuedMessage = messageQueueRef.current.shift();
          if (queuedMessage) {
            ws.send(JSON.stringify(queuedMessage));
          }
        }
        
        onConnect?.();
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        onDisconnect?.();

        // Only reconnect if not a normal closure and retries remaining
        if (shouldReconnectRef.current && retryCount < maxRetries && event.code !== 1000) {
          const delay = reconnectInterval * Math.pow(1.5, retryCount); // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            connect();
          }, delay);
        } else if (retryCount >= maxRetries) {
          setConnectionState('error');
          console.error('WebSocket max retries reached');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState('error');
        onError?.(error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          setMessageHistory((prev) => {
            const updated = [...prev, message];
            // Keep only last 100 messages
            return updated.slice(-100);
          });
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error, event.data);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setConnectionState('error');
      onError?.(error as Event);
    }
  }, [url, protocols, retryCount, maxRetries, reconnectInterval, onConnect, onDisconnect, onMessage, onError]);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else if (wsRef.current?.readyState === WebSocket.CONNECTING) {
      // Queue message if connecting
      messageQueueRef.current.push(message);
      return true;
    } else {
      console.warn('WebSocket not connected, message queued');
      messageQueueRef.current.push(message);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    setRetryCount(0);
    disconnect();
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect]); // Only depend on autoConnect to avoid reconnecting on every render

  return {
    isConnected,
    lastMessage,
    messageHistory,
    sendMessage,
    disconnect,
    reconnect,
    retryCount,
    connectionState,
  };
};
