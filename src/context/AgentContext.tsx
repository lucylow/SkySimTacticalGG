import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { AgentMessage, MemoryItem, TimelineItem, AgentEvent } from '@/types/agent';
import { simulateAgentStream } from '@/services/mockAgentStream';

interface AgentState {
  messages: AgentMessage[];
  memory: MemoryItem[];
  timeline: TimelineItem[];
  isRunning: boolean;
  promptDraft: string;
  eventsLog: AgentEvent[];
}

interface AgentContextType extends AgentState {
  setPromptDraft: (prompt: string) => void;
  runAgent: (prompt?: string) => void;
  stopAgent: () => void;
  clearMessages: () => void;
  addMemory: (text: string) => void;
  removeMemory: (id: string) => void;
}

const AgentContext = createContext<AgentContextType | null>(null);

const generateId = () => Math.random().toString(36).substring(2, 9);

const initialMemory: MemoryItem[] = [
  { id: 'm1', text: 'User prefers detailed analysis over summaries' },
  { id: 'm2', text: 'Focus on esports coaching context' },
  { id: 'm3', text: 'Player development is a priority' },
];

export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [memory, setMemory] = useState<MemoryItem[]>(initialMemory);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [promptDraft, setPromptDraft] = useState('');
  const [eventsLog, setEventsLog] = useState<AgentEvent[]>([]);
  
  const streamRef = useRef<{ cancel: () => void } | null>(null);
  const currentAssistantId = useRef<string | null>(null);

  const addMessage = useCallback((role: AgentMessage['role'], text: string): string => {
    const id = generateId();
    setMessages(prev => [...prev, {
      id,
      role,
      text,
      timestamp: Date.now()
    }]);
    return id;
  }, []);

  const updateLastAssistantMessage = useCallback((text: string) => {
    setMessages(prev => {
      const lastIdx = prev.findIndex(m => m.id === currentAssistantId.current);
      if (lastIdx === -1) return prev;
      const updated = [...prev];
      const existing = updated[lastIdx];
      if (existing) {
        updated[lastIdx] = { ...existing, text };
      }
      return updated;
      return updated;
    });
  }, []);

  const handleEvent = useCallback((event: AgentEvent, accumulatedText: { current: string }) => {
    setEventsLog(prev => [...prev, event]);

    switch (event.type) {
      case 'token':
        accumulatedText.current += event.data.text;
        updateLastAssistantMessage(accumulatedText.current);
        break;
      
      case 'tool':
        addMessage('tool', `🔧 Calling: ${event.data.tool}${event.data.args ? ` with ${JSON.stringify(event.data.args)}` : ''}`);
        break;
      
      case 'tool_result':
        addMessage('tool', `✅ ${event.data.tool}: ${JSON.stringify(event.data.result)}`);
        break;
      
      case 'timeline':
        setTimeline(prev => [{
          id: event.data.id,
          title: event.data.title,
          detail: event.data.detail,
          timestamp: Date.now()
        }, ...prev]);
        break;
      
      case 'done':
        setIsRunning(false);
        currentAssistantId.current = null;
        break;
    }
  }, [addMessage, updateLastAssistantMessage]);

  const runAgent = useCallback((prompt?: string) => {
    const finalPrompt = prompt || promptDraft;
    if (!finalPrompt.trim()) return;

    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.cancel();
    }

    setEventsLog([]);
    
    // Add user message
    addMessage('user', finalPrompt);
    
    // Create placeholder for assistant response
    currentAssistantId.current = addMessage('assistant', '');
    
    setIsRunning(true);

    // Track accumulated text for streaming
    const accumulatedText = { current: '' };
    
    // Start mock stream
    streamRef.current = simulateAgentStream(finalPrompt, (event) => {
      handleEvent(event, accumulatedText);
    });

    setPromptDraft('');
  }, [promptDraft, addMessage, handleEvent]);

  const stopAgent = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel();
      streamRef.current = null;
    }
    setIsRunning(false);
    currentAssistantId.current = null;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setTimeline([]);
    setEventsLog([]);
  }, []);

  const addMemory = useCallback((text: string) => {
    setMemory(prev => [...prev, { id: generateId(), text }]);
  }, []);

  const removeMemory = useCallback((id: string) => {
    setMemory(prev => prev.filter(m => m.id !== id));
  }, []);

  return (
    <AgentContext.Provider value={{
      messages,
      memory,
      timeline,
      isRunning,
      promptDraft,
      eventsLog,
      setPromptDraft,
      runAgent,
      stopAgent,
      clearMessages,
      addMemory,
      removeMemory
    }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};
