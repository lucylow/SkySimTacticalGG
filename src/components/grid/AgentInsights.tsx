// Agent Insights Component - Displays AI agent signals

import { useAgentSignals } from '@/hooks/useAgentSignals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, TrendingUp, DollarSign, Star, Zap } from 'lucide-react';
import type { AgentSignal } from '@/types/grid';

interface AgentInsightsProps {
  matchId?: string;
}

const signalIcons: Record<string, typeof AlertTriangle> = {
  MOMENTUM_SHIFT: TrendingUp,
  STAR_PLAYER: Star,
  ECONOMY_CRASH: DollarSign,
  STRATEGIC_PATTERN: Zap,
  CLUTCH_OPPORTUNITY: AlertTriangle,
  ROUND_CRITICAL: AlertTriangle,
};

const signalColors: Record<string, string> = {
  MOMENTUM_SHIFT: 'bg-blue-500',
  STAR_PLAYER: 'bg-yellow-500',
  ECONOMY_CRASH: 'bg-red-500',
  STRATEGIC_PATTERN: 'bg-purple-500',
  CLUTCH_OPPORTUNITY: 'bg-orange-500',
  ROUND_CRITICAL: 'bg-pink-500',
};

export function AgentInsights({ matchId }: AgentInsightsProps) {
  const { signals, isConnected } = useAgentSignals(matchId);
  const approvedSignals = signals.filter((s) => s.status === 'APPROVED');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Agent Insights</span>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {approvedSignals.length} signals
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {approvedSignals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No approved insights yet.
              </p>
            ) : (
              approvedSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function SignalCard({ signal }: { signal: AgentSignal }) {
  const Icon = signalIcons[signal.type] || AlertTriangle;
  const color = signalColors[signal.type] || 'bg-gray-500';

  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${color} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{signal.type}</Badge>
            <Badge variant="secondary" className="text-xs">
              {Math.round(signal.confidence * 100)}% confidence
            </Badge>
            {signal.team && (
              <Badge variant="secondary" className="text-xs">
                {signal.team}
              </Badge>
            )}
          </div>
          <div className="text-sm space-y-1">
            {Object.entries(signal.explanation).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="text-muted-foreground capitalize">
                  {key.replace(/_/g, ' ')}:
                </span>
                <span className="font-medium">
                  {typeof value === 'number' ? value.toFixed(2) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


