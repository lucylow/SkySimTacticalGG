// components/predictions/PredictionForm.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { predictionsApi } from "@/services/predictionsApi";
import type { PredictionMarket, VirtualWallet } from "@/types/predictions";

interface PredictionFormProps {
  market: PredictionMarket;
  wallet: VirtualWallet;
  onSuccess: () => void;
}

export function PredictionForm({ market, wallet, onSuccess }: PredictionFormProps) {
  const [selection, setSelection] = useState("");
  const [stake, setStake] = useState(10);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const availableSelections = market.odds
    ? Object.keys(market.odds)
    : market.pool_by_selection
    ? Object.keys(market.pool_by_selection)
    : [];

  const calculatePayout = () => {
    if (!selection) return 0;
    if (market.odds_type === "fixed" && market.odds) {
      const odds = market.odds[selection];
      return odds ? Math.round(stake * odds) : 0;
    }
    // Pool-based: simplified calculation
    return stake * 2;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selection) {
      toast({
        title: "Invalid selection",
        description: "Please select an outcome",
        variant: "destructive",
      });
      return;
    }
    if (stake <= 0 || stake > wallet.balance) {
      toast({
        title: "Invalid stake",
        description: `Stake must be between 1 and ${wallet.balance}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await predictionsApi.createPrediction({
        market_id: market.id,
        selection,
        stake,
      });
      toast({
        title: "Prediction placed!",
        description: `Staked ${stake} coins on ${selection}`,
      });
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to place prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const potentialPayout = calculatePayout();
  const maxStake = Math.min(wallet.balance, 1000 - wallet.daily_wagered);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="selection">Select Outcome</Label>
        <Select value={selection} onValueChange={setSelection}>
          <SelectTrigger id="selection">
            <SelectValue placeholder="Choose an outcome" />
          </SelectTrigger>
          <SelectContent>
            {availableSelections.map((sel) => (
              <SelectItem key={sel} value={sel}>
                {sel}
                {market.odds && market.odds[sel] && (
                  <span className="ml-2 text-muted-foreground">
                    ({market.odds[sel].toFixed(2)}x)
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stake">Stake (Virtual Coins)</Label>
        <Input
          id="stake"
          type="number"
          min="1"
          max={maxStake}
          value={stake}
          onChange={(e) => setStake(parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-muted-foreground">
          Max: {maxStake} coins (balance: {wallet.balance}, daily limit: {1000 - wallet.daily_wagered})
        </p>
      </div>

      {selection && stake > 0 && (
        <div className="p-3 bg-muted rounded-md">
          <div className="flex justify-between text-sm mb-1">
            <span>Potential Payout:</span>
            <span className="font-bold">{potentialPayout.toLocaleString()} coins</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Profit:</span>
            <span>{potentialPayout - stake} coins</span>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading || !selection || stake <= 0}>
        {loading ? "Placing..." : `Place Prediction (${stake} coins)`}
      </Button>
    </form>
  );
}


