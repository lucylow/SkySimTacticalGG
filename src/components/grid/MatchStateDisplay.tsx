// Match State Display Component - Shows reconstructed match state

import { useMatchState } from '@/hooks/useMatchState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MatchStateDisplayProps {
  matchId: string;
}

export function MatchStateDisplay({ matchId }: MatchStateDisplayProps) {
  const state = useMatchState(matchId);

  if (!state) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Match State</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No match state available</p>
        </CardContent>
      </Card>
    );
  }

  const teams = Object.keys(state.score);
  const totalRounds = state.round_history.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Match State</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Score</span>
            <Badge variant="outline">Round {state.current_round}</Badge>
          </div>
          <div className="space-y-2">
            {teams.map((team) => (
              <div key={team}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{team}</span>
                  <span className="text-sm font-bold">{state.score[team] || 0}</span>
                </div>
                <Progress
                  value={(state.score[team] || 0) / Math.max(totalRounds, 1) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Economy */}
        <div>
          <div className="text-sm font-medium mb-2">Team Economy</div>
          <div className="space-y-1">
            {teams.map((team) => (
              <div key={team} className="flex items-center justify-between">
                <span className="text-sm">{team}</span>
                <span className="text-sm font-mono">
                  ${state.team_economy[team]?.toLocaleString() || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Players */}
        <div>
          <div className="text-sm font-medium mb-2">Top Players</div>
          <div className="space-y-1">
            {Object.values(state.players)
              .sort((a, b) => b.kills - a.kills)
              .slice(0, 5)
              .map((player) => (
                <div key={player.player_id} className="flex items-center justify-between text-sm">
                  <span>{player.player_id}</span>
                  <div className="flex gap-3">
                    <span className="text-muted-foreground">
                      {player.kills}K / {player.deaths}D / {player.assists}A
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


