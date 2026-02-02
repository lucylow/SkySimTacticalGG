import React, { useState } from 'react';
import { Brain, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgent } from '@/context/AgentContext';

export const MemoryPanel: React.FC = () => {
  const { memory, addMemory, removeMemory } = useAgent();
  const [newMemory, setNewMemory] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newMemory.trim()) {
      addMemory(newMemory.trim());
      setNewMemory('');
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Memory
        </h3>
        <Button 
          size="sm" 
          variant="ghost" 
          className="h-7 w-7 p-0"
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      {isAdding && (
        <div className="flex gap-2">
          <Input
            value={newMemory}
            onChange={(e) => setNewMemory(e.target.value)}
            placeholder="Add context..."
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>Add</Button>
        </div>
      )}
      
      <ScrollArea className="h-[150px]">
        <div className="space-y-2">
          {memory.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No memory items
            </p>
          ) : (
            memory.map((item) => (
              <div 
                key={item.id}
                className="group flex items-start gap-2 p-2 rounded-md bg-muted/30 border border-border/30"
              >
                <span className="text-xs flex-1 leading-relaxed">{item.text}</span>
                <button
                  onClick={() => removeMemory(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/20 rounded"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground">
        Memory persists context across agent runs.
      </p>
    </div>
  );
};
