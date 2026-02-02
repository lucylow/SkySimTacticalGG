// Real-Time Tactical Overlay Component
// Displays live insights and alerts during matches

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Users, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Insight } from '@/types';

export interface TacticalOverlayData {
  current_phase: string;
  team_coordination: number;
  key_events: Array<{
    timestamp: number;
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  predicted_actions: Array<{
    action: string;
    confidence: number;
    player_id: string;
    player_name?: string;
    time_window?: string; // e.g., "next 10s"
  }>;
  alerts: Insight[];
  predictive_insights?: Array<{
    type: 'opponent_strategy' | 'economic_decision' | 'fatigue_warning' | 'pattern_detection';
    title: string;
    description: string;
    confidence: number;
    recommendation: string;
    urgency: 'high' | 'medium' | 'low';
  }>;
  micro_macro_alerts?: Array<{
    micro_action: string;
    macro_risk: string;
    correlation_strength: number;
    recommendation: string;
  }>;
}

interface TacticalOverlayProps {
  data: TacticalOverlayData;
  isLive?: boolean;
}

export const TacticalOverlay: React.FC<TacticalOverlayProps> = ({ data, isLive = false }) => {
  return (
    <Card className="glass-card border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Real-Time Tactical Overlay
          </CardTitle>
          {isLive && (
            <Badge variant="destructive" className="animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Phase & Coordination */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">Current Phase</p>
            <p className="text-lg font-semibold capitalize">{data.current_phase}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Team Coordination</p>
                <p className="text-lg font-semibold">
                  {Math.round(data.team_coordination * 100)}%
                </p>
              </div>
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${data.team_coordination * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Key Events */}
        {data.key_events.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Recent Key Events</h4>
            <ScrollArea className="h-32">
              <div className="space-y-2">
                <AnimatePresence>
                  {data.key_events.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className={`rounded-lg border p-2 text-xs ${
                        event.impact === 'high'
                          ? 'border-amber-500/50 bg-amber-500/10'
                          : event.impact === 'medium'
                          ? 'border-primary/50 bg-primary/10'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {event.impact === 'high' ? (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        ) : (
                          <Info className="h-3 w-3 text-primary" />
                        )}
                        <span className="flex-1">{event.description}</span>
                        <span className="text-muted-foreground">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Predicted Actions */}
        {data.predicted_actions.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Predicted Actions</h4>
            <div className="space-y-2">
              {data.predicted_actions.slice(0, 3).map((action, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-2"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-sm">{action.action}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(action.confidence * 100)}%
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Predictive Insights */}
        {data.predictive_insights && data.predictive_insights.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Proactive Insights
            </h4>
            <div className="space-y-2">
              {data.predictive_insights.map((insight, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`rounded-lg border p-3 ${
                    insight.urgency === 'high'
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-primary/50 bg-primary/10'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Info className="mt-0.5 h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{insight.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(insight.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {insight.description}
                      </p>
                      <p className="text-xs font-medium text-primary">
                        💡 {insight.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Micro-Macro Alerts */}
        {data.micro_macro_alerts && data.micro_macro_alerts.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Micro-Macro Correlations
            </h4>
            <div className="space-y-2">
              {data.micro_macro_alerts.map((alert, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        {alert.micro_action} → {alert.macro_risk}
                      </p>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground">Correlation:</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(alert.correlation_strength * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-primary font-medium">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {data.alerts.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium">Active Alerts</h4>
            <div className="space-y-2">
              <AnimatePresence>
                {data.alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`rounded-lg border p-3 ${
                      alert.type === 'warning'
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : alert.type === 'success'
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-primary/50 bg-primary/10'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {alert.type === 'warning' ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                      ) : alert.type === 'success' ? (
                        <CheckCircle className="mt-0.5 h-4 w-4 text-accent" />
                      ) : (
                        <Info className="mt-0.5 h-4 w-4 text-primary" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {alert.description}
                        </p>
                      </div>
                      {alert.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          HIGH
                        </Badge>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

