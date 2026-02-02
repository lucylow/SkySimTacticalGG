import React from 'react';
import { Play, Square, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAgent } from '@/context/AgentContext';

const samplePrompts = [
  'Analyze player performance trends and suggest improvements',
  'Search for patterns in recent match data',
  'Help me understand team coordination issues',
  'Generate a training plan for the team',
];

export const PromptEditor: React.FC = () => {
  const { promptDraft, setPromptDraft, runAgent, stopAgent, isRunning } = useAgent();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      runAgent();
    }
  };

  return (
    <div className="space-y-3" data-tour="prompt-editor">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Prompt
        </h3>
        <span className="text-xs text-muted-foreground">⌘+Enter to run</span>
      </div>

      <Textarea
        value={promptDraft}
        onChange={(e) => setPromptDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Try: Audit product catalog and suggest 3 quick UI changes that increase CTR"
        className="min-h-[120px] bg-background/50 border-border/50 resize-none focus:border-primary/50"
        disabled={isRunning}
        aria-label="Prompt editor for AI agent"
      />

      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setPromptDraft(prompt)}
            className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            disabled={isRunning}
          >
            {prompt.slice(0, 30)}...
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        {isRunning ? (
          <Button
            onClick={stopAgent}
            variant="destructive"
            className="flex-1"
            aria-label="Stop agent execution"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop stream
          </Button>
        ) : (
          <Button
            onClick={() => runAgent()}
            disabled={!promptDraft.trim()}
            className="flex-1"
            data-tour="run-button"
            aria-label="Run AI agent analysis"
          >
            <Play className="w-4 h-4 mr-2" />
            Run analysis
          </Button>
        )}
      </div>
    </div>
  );
};
