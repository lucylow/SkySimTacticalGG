import React from 'react';
import { Sparkles, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AgentProvider, useAgent } from '@/context/AgentContext';
import { PromptEditor } from '@/components/agent/PromptEditor';
import { AgentConsole } from '@/components/agent/AgentConsole';
import { Toolbox } from '@/components/agent/Toolbox';
import { Timeline } from '@/components/agent/Timeline';
import { MemoryPanel } from '@/components/agent/MemoryPanel';
import { EventsLog } from '@/components/agent/EventsLog';
import { OnboardingTour, aiPlaygroundTourSteps } from '@/components/ui/onboarding-tour';

const PlaygroundContent: React.FC = () => {
  const { clearMessages, isRunning } = useAgent();

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">AI Agent Playground</h1>
            <p className="text-sm text-muted-foreground">
              Interactive AI with streaming, tools, memory, and timeline
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={clearMessages} disabled={isRunning}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Prompt & Console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Editor */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <PromptEditor />
            </CardContent>
          </Card>

          {/* Console */}
          <Card className="glass-card min-h-[400px]">
            <CardContent className="p-4 h-[400px]">
              <AgentConsole />
            </CardContent>
          </Card>

          {/* Events Log */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <EventsLog />
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Tools, Timeline, Memory */}
        <div className="space-y-6">
          {/* Toolbox */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <Toolbox />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <Timeline />
            </CardContent>
          </Card>

          {/* Memory */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <MemoryPanel />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-muted-foreground py-4">
        <p>Mock AI Agent • Streaming SSE simulation • No backend required</p>
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour steps={aiPlaygroundTourSteps} storageKey="ai-playground-tour-completed" />
    </div>
  );
};

const AIPlayground: React.FC = () => {
  return (
    <AgentProvider>
      <PlaygroundContent />
    </AgentProvider>
  );
};

export default AIPlayground;
