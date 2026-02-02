// Personalized Insight Card - Displays insights in the format:
// "Data: ... Insight: ... Recommendation: ..."

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  TrendingUp, 
  Target,
  CheckCircle2,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PersonalizedInsight } from '@/types/insights';

interface PersonalizedInsightCardProps {
  insight: PersonalizedInsight;
  onVisualize?: (insight: PersonalizedInsight) => void;
}

const priorityColors = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

const priorityIcons = {
  critical: AlertTriangle,
  high: TrendingUp,
  medium: Info,
  low: CheckCircle2,
};

export const PersonalizedInsightCard: React.FC<PersonalizedInsightCardProps> = ({
  insight,
  onVisualize,
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const priority = insight.priority || 'medium';
  const color = priorityColors[priority];
  const Icon = priorityIcons[priority];
  const confidence = Math.round((insight.confidence || insight.severity) * 100);
  
  // Use new format if available, otherwise fall back to old format
  const dataStatement = insight.data_statement || insight.description;
  const insightText = insight.insight || insight.description;
  const recommendation = insight.recommendation || 'No specific recommendation available.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'glass-card border-l-4 transition-all hover:shadow-lg',
          'border-l-[var(--priority-color)]'
        )}
        style={{ '--priority-color': color } as React.CSSProperties}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon className="h-5 w-5" style={{ color: color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-lg">{insight.title}</h4>
                  <Badge
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${color}20`, 
                      color: color 
                    }}
                  >
                    {priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Confidence: {confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Data Statement */}
          <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-sm font-semibold text-muted-foreground">DATA:</span>
            </div>
            <p className="text-sm leading-relaxed font-medium">
              {dataStatement}
            </p>
          </div>

          {/* Insight */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-2 mb-2">
              <span className="text-sm font-semibold text-primary">INSIGHT:</span>
            </div>
            <p className="text-sm leading-relaxed">
              {insightText}
            </p>
          </div>

          {/* Recommendation */}
          <div
            className="p-4 rounded-lg border border-dashed"
            style={{
              backgroundColor: `${color}08`,
              borderColor: `${color}30`,
            }}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="text-lg">💡</span>
              <span 
                className="text-sm font-semibold"
                style={{ color: color }}
              >
                RECOMMENDATION:
              </span>
            </div>
            <p className="text-sm leading-relaxed pl-6">
              {recommendation}
            </p>
          </div>

          {/* Expandable Details */}
          {insight.supporting_evidence && insight.supporting_evidence.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="w-full justify-between"
              >
                <span className="text-xs text-muted-foreground">
                  {expanded ? 'Hide' : 'Show'} Supporting Evidence
                </span>
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 p-4 rounded-lg bg-muted/30 border"
                >
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    SUPPORTING EVIDENCE:
                  </p>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(insight.supporting_evidence, null, 2)}
                  </pre>
                </motion.div>
              )}
            </div>
          )}

          {/* Metadata */}
          {(insight.metadata.rounds_affected.length > 0 || insight.metadata.map_name) && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
              {insight.metadata.map_name && (
                <span>Map: {insight.metadata.map_name}</span>
              )}
              {insight.metadata.rounds_affected.length > 0 && (
                <span>
                  {insight.metadata.rounds_affected.length} round{insight.metadata.rounds_affected.length !== 1 ? 's' : ''} affected
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {insight.visualization && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVisualize?.(insight)}
                className="flex-1"
              >
                <Target className="mr-2 h-4 w-4" />
                View Visualization
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


