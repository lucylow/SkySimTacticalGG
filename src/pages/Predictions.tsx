// pages/Predictions.tsx
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { predictionsApi } from "@/services/predictionsApi";
import { useToast } from "@/hooks/use-toast";
import { WalletCard } from "@/components/predictions/WalletCard";
import { MarketList } from "@/components/predictions/MarketList";
import { PredictionHistory } from "@/components/predictions/PredictionHistory";
import { PredictionStatsCard } from "@/components/predictions/StatsCard";
import { Leaderboard } from "@/components/predictions/Leaderboard";
import type {
  VirtualWallet,
  PredictionMarket,
  Prediction,
  PredictionStats,
  LeaderboardEntry,
} from "@/types/predictions";

export function Predictions() {
  const [wallet, setWallet] = useState<VirtualWallet | null>(null);
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState<PredictionStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [walletData, marketsData, predictionsData, statsData, leaderboardData] =
        await Promise.all([
          predictionsApi.getWallet().catch(() => null),
          predictionsApi.listMarkets(undefined, "open"),
          predictionsApi.listPredictions(),
          predictionsApi.getStats().catch(() => null),
          predictionsApi.getLeaderboard("overall", 20).catch(() => []),
        ]);

      if (walletData) setWallet(walletData);
      setMarkets(marketsData);
      setPredictions(predictionsData);
      if (statsData) setStats(statsData);
      setLeaderboard(leaderboardData);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error instanceof Error ? error.message : "Failed to load",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Esports Predictions</h1>
          <p className="text-muted-foreground mt-1">
            Predict match outcomes and earn virtual currency (non-monetary)
          </p>
        </div>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {wallet && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <WalletCard wallet={wallet} onUpdate={loadData} />
          </div>
          <div className="md:col-span-2">
            {stats && <PredictionStatsCard stats={stats} />}
          </div>
        </div>
      )}

      <Tabs defaultValue="markets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="markets">Markets</TabsTrigger>
          <TabsTrigger value="predictions">My Predictions</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="markets" className="space-y-4">
          {wallet ? (
            <MarketList markets={markets} wallet={wallet} onUpdate={loadData} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading wallet...
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <PredictionHistory predictions={predictions} onUpdate={loadData} />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Leaderboard
            entries={leaderboard}
            currentUser={wallet?.username}
          />
        </TabsContent>
      </Tabs>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Important Notice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            This is a non-monetary prediction platform for educational and entertainment purposes only.
            Virtual currency has no real-world value and cannot be exchanged for money or prizes.
            This system is designed to help users learn about probability, expected value, and risk assessment
            in a safe, controlled environment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}


