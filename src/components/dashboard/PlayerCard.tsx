import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
  selected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onClick,
  selected,
}) => {
  const roleColors: Record<string, string> = {
    duelist: 'bg-destructive/20 text-destructive',
    initiator: 'bg-secondary/20 text-secondary',
    controller: 'bg-primary/20 text-primary',
    sentinel: 'bg-accent/20 text-accent',
    igl: 'bg-amber-500/20 text-amber-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          'glass-card cursor-pointer transition-all',
          selected && 'ring-2 ring-primary',
          onClick && 'hover:bg-muted/50'
        )}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-primary text-white">
                {player.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{player.name}</h4>
                <Badge
                  variant="secondary"
                  className={cn('capitalize', roleColors[player.role])}
                >
                  {player.role}
                </Badge>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">K/D</p>
                  <p className="font-semibold">{player.stats.kd_ratio}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ADR</p>
                  <p className="font-semibold">{player.stats.adr}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">KAST</p>
                  <p className="font-semibold">{player.stats.kast}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Performance</span>
              <span className="font-medium">{Math.round(player.stats.kast)}%</span>
            </div>
            <Progress value={player.stats.kast} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
