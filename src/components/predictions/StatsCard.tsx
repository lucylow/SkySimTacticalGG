// components/predictions/StatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Award, BarChart3 } from "lucide-react";
import type { PredictionStats } from "@/types/predictions";

interface StatsCardProps {
  stats: PredictionStats;
}

export function PredictionStatsCard({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.total_predictions}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Win Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.wins}W / {stats.losses}L
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Net Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp
              className={`h-5 w-5 ${
                stats.net_profit >= 0 ? "text-green-500" : "text-red-500"
              }`}
            />
            <p
              className={`text-2xl font-bold ${
                stats.net_profit >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {stats.net_profit >= 0 ? "+" : ""}
              {stats.net_profit.toLocaleString()}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Won: {stats.total_won.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Expected Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-bold">
              {stats.expected_value !== null && stats.expected_value !== undefined
                ? `${stats.expected_value >= 0 ? "+" : ""}${stats.expected_value.toFixed(2)}`
                : "N/A"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Per prediction</p>
        </CardContent>
      </Card>
    </div>
  );
}


