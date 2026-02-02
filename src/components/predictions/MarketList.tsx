// components/predictions/MarketList.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TrendingUp, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { PredictionMarket, VirtualWallet } from "@/types/predictions";
import { PredictionForm } from "./PredictionForm";

interface MarketListProps {
  markets: PredictionMarket[];
  wallet: VirtualWallet;
  onUpdate: () => void;
}

export function MarketList({ markets, wallet, onUpdate }: MarketListProps) {
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "settled":
        return <Badge variant="outline">Settled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatOdds = (odds: Record<string, number> | undefined, oddsType: string) => {
    if (!odds) return "N/A";
    if (oddsType === "pool") return "Pool-based";
    return Object.entries(odds)
      .map(([selection, value]) => `${selection}: ${value.toFixed(2)}x`)
      .join(", ");
  };

  if (markets.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No markets available at the moment
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {markets.map((market) => (
        <Card key={market.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{market.market_type.replace("_", " ").toUpperCase()}</CardTitle>
              {getStatusBadge(market.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Match: {market.match_id} {market.market_key && `• ${market.market_key}`}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Odds</p>
                <p className="text-sm font-medium">{formatOdds(market.odds, market.odds_type)}</p>
              </div>

              {market.odds_type === "pool" && market.pool_by_selection && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Pool Distribution</p>
                  <div className="space-y-1">
                    {Object.entries(market.pool_by_selection).map(([selection, amount]) => (
                      <div key={selection} className="flex justify-between text-sm">
                        <span>{selection}</span>
                        <span className="font-medium">{amount.toLocaleString()} coins</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Total Pool: {market.pool_total.toLocaleString()} coins
                  </p>
                </div>
              )}

              {market.status === "open" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => setSelectedMarket(market)}
                      disabled={wallet.balance === 0}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Place Prediction
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Place Prediction</DialogTitle>
                      <DialogDescription>
                        Predict the outcome and stake virtual coins
                      </DialogDescription>
                    </DialogHeader>
                    {selectedMarket && (
                      <PredictionForm
                        market={selectedMarket}
                        wallet={wallet}
                        onSuccess={() => {
                          onUpdate();
                          setSelectedMarket(null);
                        }}
                      />
                    )}
                  </DialogContent>
                </Dialog>
              )}

              {market.status === "settled" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  Market settled
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


