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
import { useUndoToast } from '@/components/ui/undo-toast';
import { ValorantOpponentAnalysisView } from '@/components/valorant/ValorantOpponentAnalysisView';
import lolOpponentData from '@/mock-data/lolOpponentData.json';

const PlaygroundContent: React.FC = () => {
  const { messages, timeline, eventsLog, setMessages, setTimeline, setEventsLog, clearMessages, isRunning } = useAgent();
  const { showUndoToast } = useUndoToast();

  // Minimal mock data to showcase Valorant opponent analysis
  const mockValorantAnalysis = {
    opponent_profile: {
      likelyOpener: 'Heavy A lobby pressure into split A execute',
      economy_habits: ['Force second round after plant', 'Low investment on bonus'],
      postplant_tendencies: ['Double swing from Hell', 'Late flank from A Main']
    },
    quick_rules: [
      'Deny A lobby or early rotate 1 to Tree',
      'Hold anti-flash close Dice',
      'Save one smoke for post-plant retake'
    ],
    exploitable_patterns: [
      {
        id: 'p1',
        category: 'Default',
        pattern: 'A lobby control telegraphed by double flash early',
        severity: 'high',
        what_you_see: ['Sova drone + Skye flash at 1:40', 'Late lurk mid minimal'],
        exploit: ['Pop flash through A Main smoke at 1:37', 'Fast Cat split to punish utility dump']
      },
      {
        id: 'p2',
        category: 'Retake',
        pattern: 'Post-plant double swing from Hell predictable',
        severity: 'medium',
        what_you_see: ['No one planted for A Main', 'Killjoy turret A Link'],
        exploit: ['Smoke Heaven, double swing Dice from Stairs', 'Molly default then wide swing from Door']
      }
    ]
  } as any;

  const handleClear = () => {
    const previousMessages = [...messages];
    const previousTimeline = [...timeline];
    const previousEvents = [...eventsLog];

    clearMessages();

    showUndoToast('History cleared', () => {
      setMessages(previousMessages);
      setTimeline(previousTimeline);
      setEventsLog(previousEvents);
    });
  };

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
          <Button variant="outline" size="sm" onClick={handleClear} disabled={isRunning}>
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

          {/* Valorant - Mock Opponent Analysis */}
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="mb-3 text-sm font-semibold">1. VALORANT</div>
              <ValorantOpponentAnalysisView analysis={mockValorantAnalysis} />
            </CardContent>
          </Card>

          {/* League of Legends - Mock Data */}
          <Card className="glass-card">
            <CardContent className="p-4 space-y-3">
              <div className="text-sm font-semibold">2. League of Legends</div>
              <div className="text-xs text-muted-foreground">Opponent: {lolOpponentData.opponent_data?.team_name || lolOpponentData.opponent_team}</div>
              <div>
                <div className="text-xs font-medium mb-1">Our Team Comp</div>
                <div className="flex flex-wrap gap-2">
                  {(lolOpponentData.team_composition || []).map((c: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] rounded border bg-muted">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium mb-1">Clutch Performance (Opp.)</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(lolOpponentData.opponent_data?.clutch_performance || {}).map(([k, v]: [string, any]) => (
                    <span key={k} className="px-2 py-0.5 text-[10px] rounded border">
                      {k.replaceAll('_',' ')}: <span className="font-semibold">{(Number(v) * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
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
