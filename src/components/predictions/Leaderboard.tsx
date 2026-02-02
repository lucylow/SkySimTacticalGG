// components/predictions/Leaderboard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "@/types/predictions";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUser?: string;
}

export function Leaderboard({ entries, currentUser }: LeaderboardProps) {
  const getRankIcon = (rank?: number) => {
    if (!rank) return null;
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No leaderboard data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {entries.map((entry) => {
            const isCurrentUser = entry.username === currentUser;
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isCurrentUser ? "bg-primary/10 border-primary" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {getRankIcon(entry.rank)}
                  <div className="flex items-center gap-2">
                    <span className="font-medium w-8">
                      {entry.rank ? `#${entry.rank}` : "-"}
                    </span>
                    <span className={isCurrentUser ? "font-bold" : ""}>
                      {entry.username}
                    </span>
                    {isCurrentUser && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{entry.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Score</p>
                  </div>
                  {entry.accuracy && (
                    <div className="text-right w-16">
                      <p className="font-semibold">{entry.accuracy}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  )}
                  <div className="text-right w-16">
                    <p className="font-semibold">{entry.wins}W</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_predictions} total
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


