import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, AlertTriangle, TrendingUp, Target, DollarSign, Map, Users, BarChart3, Crosshair, Zap, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PersonalizedInsight } from '@/types/insights';
import { backendApi } from '@/services/backendApi';
import { MotionViewer } from '@/components/motion/MotionViewer';

interface PlayerInsightCardProps {
  insight: PersonalizedInsight;
  onViewVisualization?: (motionId: string) => void;
}

const insightTypeIcons: Record<PersonalizedInsight['type'], React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  PEEK_PREDICTABILITY: Target,
  UTILITY_EFFICIENCY: TrendingUp,
  TRADE_WINDOW: Users,
  ECONOMIC_DECISION: DollarSign,
  MAP_CONTROL: Map,
  TEAM_COORDINATION: Users,
  OPENING_DUEL_IMPACT: Crosshair,
  ROUND_WIN_CORRELATION: BarChart3,
  MAP_SPECIFIC_PATTERN: Zap,
  ECONOMIC_SNOWBALL: Coins,
};

const insightTypeLabels: Record<PersonalizedInsight['type'], string> = {
  PEEK_PREDICTABILITY: 'Peek Predictability',
  UTILITY_EFFICIENCY: 'Utility Efficiency',
  TRADE_WINDOW: 'Trade Timing',
  ECONOMIC_DECISION: 'Economic Strategy',
  MAP_CONTROL: 'Map Control',
  TEAM_COORDINATION: 'Team Coordination',
  OPENING_DUEL_IMPACT: 'Opening Duel Impact',
  ROUND_WIN_CORRELATION: 'Round Win Correlation',
  MAP_SPECIFIC_PATTERN: 'Map Pattern',
  ECONOMIC_SNOWBALL: 'Economic Snowball',
};

export const PlayerInsightCard: React.FC<PlayerInsightCardProps> = ({
  insight,
  onViewVisualization,
}) => {
  const [showMotionViewer, setShowMotionViewer] = useState(false);
  const [motionData, setMotionData] = useState<any>(null);
  const [loadingMotion, setLoadingMotion] = useState(false);

  const severityColor =
    insight.severity > 0.7 ? '#ef4444' : insight.severity > 0.4 ? '#f59e0b' : '#3b82f6';

  const Icon = insightTypeIcons[insight.type] || AlertTriangle;
  const typeLabel = insightTypeLabels[insight.type] || insight.type;

  const handleViewVisualization = async () => {
    if (insight.visualization?.motion_sequence_id) {
      setLoadingMotion(true);
      try {
        const sequence = await backendApi.getMotionSequence(
          insight.visualization.motion_sequence_id
        );
        if (sequence) {
          // Convert MotionSequence to MotionData format
          // MotionSequence has joint_positions as number[][], we need to convert to Joint format
          const frames = Array.from({ length: sequence.duration_frames }, (_, i) => {
            const jointPositions = sequence.motion_data.joint_positions[i] || [];
            // Create joints from joint positions (assuming 22 joints for SMPL)
            const joints = Array.from(
              { length: Math.min(22, jointPositions.length / 3) },
              (_, jointIdx) => {
                const baseIdx = jointIdx * 3;
                return {
                  name: `joint_${jointIdx}`,
                  position: [
                    jointPositions[baseIdx] || 0,
                    jointPositions[baseIdx + 1] || 0,
                    jointPositions[baseIdx + 2] || 0,
                  ] as [number, number, number],
                  rotation: [0, 0, 0, 1] as [number, number, number, number],
                };
              }
            );

            return {
              timestamp: i / sequence.fps,
              joints,
            };
          });

          setMotionData({
            id: sequence.id,
            fps: sequence.fps,
            duration: sequence.duration_frames / sequence.fps,
            frames,
            skeleton: [
              { name: 'root', parent: -1 },
              { name: 'spine', parent: 0 },
              { name: 'head', parent: 1 },
            ],
          });
          setShowMotionViewer(true);
        }
      } catch (error) {
        console.error('Failed to load motion visualization:', error);
      } finally {
        setLoadingMotion(false);
      }
    } else if (onViewVisualization) {
      onViewVisualization(insight.id);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          className={cn(
            'glass-card border-l-4 transition-all hover:shadow-lg',
            'border-l-[var(--severity-color)]'
          )}
          style={{ '--severity-color': severityColor } as React.CSSProperties}
        >
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${severityColor}20` }}
                >
                  <Icon className="h-5 w-5" style={{ color: severityColor }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-lg">{insight.title}</h4>
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{
                        backgroundColor: `${severityColor}20`,
                        color: severityColor,
                      }}
                    >
                      {typeLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                </div>
              </div>
              <Badge
                className="text-xs font-semibold"
                style={{
                  backgroundColor: `${severityColor}20`,
                  color: severityColor,
                }}
              >
                {Math.round(insight.severity * 100)}% Impact
              </Badge>
            </div>

            {/* Impact Metric */}
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-1">Impact Analysis</p>
              <p className="text-sm">{insight.impact_metric}</p>
            </div>

            {/* Recommendation */}
            <div
              className="p-4 rounded-lg mb-4 border border-dashed"
              style={{
                backgroundColor: `${severityColor}08`,
                borderColor: `${severityColor}30`,
              }}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-lg">💡</span>
                <p className="text-xs font-semibold" style={{ color: severityColor }}>
                  Coach's Recommendation:
                </p>
              </div>
              <p className="text-sm leading-relaxed pl-6">{insight.recommendation}</p>
            </div>

            {/* Metadata */}
            {(insight.metadata.rounds_affected.length > 0 || insight.metadata.map_name) && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                {insight.metadata.map_name && <span>Map: {insight.metadata.map_name}</span>}
                {insight.metadata.rounds_affected.length > 0 && (
                  <span>
                    {insight.metadata.rounds_affected.length} round
                    {insight.metadata.rounds_affected.length !== 1 ? 's' : ''} affected
                  </span>
                )}
              </div>
            )}

            {/* Visualization Button */}
            {insight.visualization && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  void handleViewVisualization();
                }}
                disabled={loadingMotion}
              >
                {loadingMotion ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    View Corrective Animation
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Motion Viewer Modal */}
      {showMotionViewer && motionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80"
              onClick={() => {
                setShowMotionViewer(false);
                setMotionData(null);
              }}
            >
              ×
            </Button>
            <MotionViewer motionData={motionData} />
          </div>
        </div>
      )}
    </>
  );
};
