import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Player } from '@/types';
import type { EsportsPlayer } from '@/types/esports';

interface PlayerCardProps {
  player: Player | EsportsPlayer;
  onClick?: () => void;
  selected?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  onClick,
  selected,
}) => {
  const isEsportsPlayer = 'game' in player;
  const gameType = isEsportsPlayer ? player.game : 'valorant';

  const roleColors: Record<string, string> = {
    // Valorant roles
    duelist: 'bg-destructive/20 text-destructive',
    initiator: 'bg-secondary/20 text-secondary',
    controller: 'bg-primary/20 text-primary',
    sentinel: 'bg-accent/20 text-accent',
    igl: 'bg-amber-500/20 text-amber-500',
    // LoL roles
    TOP: 'bg-blue-500/20 text-blue-500',
    JUNGLE: 'bg-green-500/20 text-green-500',
    MID: 'bg-purple-500/20 text-purple-500',
    ADC: 'bg-orange-500/20 text-orange-500',
    SUPPORT: 'bg-pink-500/20 text-pink-500',
  };

  const getStats = () => {
    if (gameType === 'lol') {
      const stats = (player as any).stats;
      return [
        { label: 'KDA', value: stats.kda || '0.0' },
        { label: 'CS@15', value: stats.cs_at_15 || '0' },
        { label: 'WR', value: `${stats.win_rate || 0}%` },
      ];
    } else {
      const stats = (player as any).stats;
      return [
        { label: 'K/D', value: stats.kd_ratio || '0.0' },
        { label: 'ADR', value: stats.adr || '0' },
        { label: 'KAST', value: `${stats.kast || 0}%` },
      ];
    }
  };

  const stats = getStats();
  const performanceValue = gameType === 'lol' ? (player as any).stats.win_rate : (player as any).stats.kast;

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
                <h4 className="font-semibold truncate">{player.name}</h4>
                <Badge
                  variant="secondary"
                  className={cn('capitalize', roleColors[player.role] || 'bg-muted text-muted-foreground')}
                >
                  {player.role}
                </Badge>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <p className="text-muted-foreground text-[10px] uppercase">{stat.label}</p>
                    <p className="font-semibold">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Performance Rating</span>
              <span className="font-medium">{Math.round(performanceValue || 0)}%</span>
            </div>
            <Progress value={performanceValue || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
