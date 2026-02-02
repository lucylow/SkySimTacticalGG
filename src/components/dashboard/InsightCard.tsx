import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Insight } from '@/types';

interface InsightCardProps {
  insight: Insight;
  onAction?: () => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onAction }) => {
  const typeConfig = {
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-l-amber-500',
      iconColor: 'text-amber-500',
    },
    improvement: {
      icon: TrendingUp,
      bgColor: 'bg-secondary/10',
      borderColor: 'border-l-secondary',
      iconColor: 'text-secondary',
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-accent/10',
      borderColor: 'border-l-accent',
      iconColor: 'text-accent',
    },
    info: {
      icon: Info,
      bgColor: 'bg-primary/10',
      borderColor: 'border-l-primary',
      iconColor: 'text-primary',
    },
  };

  const config = typeConfig[insight.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          'glass-card border-l-4 transition-all hover:shadow-lg',
          config.borderColor
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                config.bgColor
              )}
            >
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <h4 className="font-semibold">{insight.title}</h4>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                    insight.priority === 'high'
                      ? 'bg-destructive/20 text-destructive'
                      : insight.priority === 'medium'
                      ? 'bg-amber-500/20 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {insight.priority}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{insight.description}</p>

              {insight.actionable && onAction && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 -ml-2 text-primary"
                  onClick={onAction}
                >
                  Take Action
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
