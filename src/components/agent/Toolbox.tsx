import React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAgent } from '@/context/AgentContext';
import { availableTools } from '@/services/mockAgentStream';

export const Toolbox: React.FC = () => {
  const { isRunning } = useAgent();

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <Wrench className="w-4 h-4 text-primary" />
        Available Tools
      </h3>
      
      <div className="space-y-2">
        {availableTools.map((tool) => (
          <div
            key={tool.name}
            className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors"
          >
            <span className="text-lg">{tool.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tool.name}</p>
              <p className="text-xs text-muted-foreground truncate">{tool.description}</p>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="shrink-0 h-7 text-xs"
              disabled={isRunning}
            >
              Test
            </Button>
          </div>
        ))}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Tools are automatically invoked by the agent based on your prompt.
      </p>
    </div>
  );
};
