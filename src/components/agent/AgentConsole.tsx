import React, { useEffect, useRef } from 'react';
import { User, Bot, Wrench, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgent } from '@/context/AgentContext';
import { cn } from '@/lib/utils';

export const AgentConsole: React.FC = () => {
  const { messages, isRunning } = useAgent();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'assistant':
        return <Bot className="w-4 h-4" />;
      case 'tool':
        return <Wrench className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getRoleStyles = (role: string) => {
    switch (role) {
      case 'user':
        return 'bg-primary/10 border-primary/20';
      case 'assistant':
        return 'bg-secondary/50 border-secondary';
      case 'tool':
        return 'bg-accent/10 border-accent/20';
      default:
        return 'bg-muted';
    }
  };

  return (
    <div className="flex flex-col h-full" data-tour="console">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Console</h3>
        {isRunning && (
          <div
            className="flex items-center gap-2 text-xs text-primary"
            role="status"
            aria-live="polite"
            aria-label="Agent is streaming response"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing...
          </div>
        )}
      </div>

      <ScrollArea
        className="flex-1 pr-4"
        ref={scrollRef}
        role="log"
        aria-label="Agent conversation log"
      >
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Write a prompt and run the agent</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('rounded-lg border p-3 transition-all', getRoleStyles(msg.role))}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'p-1 rounded',
                      msg.role === 'user' && 'bg-primary/20 text-primary',
                      msg.role === 'assistant' && 'bg-secondary text-secondary-foreground',
                      msg.role === 'tool' && 'bg-accent/20 text-accent-foreground'
                    )}
                  >
                    {getRoleIcon(msg.role)}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-wide">{msg.role}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  role={msg.role === 'assistant' ? 'status' : undefined}
                  aria-live={msg.role === 'assistant' && isRunning ? 'polite' : 'off'}
                >
                  {msg.text ? (
                    <span className="token-stream">{msg.text}</span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-muted-foreground"
                      role="status"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      Thinking...
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
