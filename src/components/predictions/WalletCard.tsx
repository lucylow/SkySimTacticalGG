// components/predictions/WalletCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Coins, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { predictionsApi } from "@/services/predictionsApi";
import { useToast } from "@/hooks/use-toast";
import type { VirtualWallet } from "@/types/predictions";

interface WalletCardProps {
  wallet: VirtualWallet;
  onUpdate: () => void;
}

export function WalletCard({ wallet, onUpdate }: WalletCardProps) {
  const [topUpAmount, setTopUpAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTopUp = async () => {
    if (topUpAmount <= 0 || topUpAmount > 1000) {
      toast({
        title: "Invalid amount",
        description: "Amount must be between 1 and 1000",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await predictionsApi.topUpWallet({ amount: topUpAmount });
      toast({
        title: "Success",
        description: `Added ${topUpAmount} virtual coins to your wallet`,
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to top up",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyRemaining = 1000 - wallet.daily_wagered;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Virtual Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-3xl font-bold">{wallet.balance.toLocaleString()}</p>
          </div>
          <Coins className="h-12 w-12 text-yellow-500" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total Earned</p>
            <p className="text-lg font-semibold">{wallet.total_earned.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Wagered</p>
            <p className="text-lg font-semibold">{wallet.total_wagered.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Daily Limit</p>
            <p className="text-xs font-medium">
              {wallet.daily_wagered}/1000 used
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(wallet.daily_wagered / 1000) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {dailyRemaining} remaining today
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Top Up Virtual Currency</DialogTitle>
              <DialogDescription>
                Add virtual coins to your wallet (max 1000 per day)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max="1000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground">
                  Daily limit: {dailyRemaining} remaining
                </p>
              </div>
              <Button
                onClick={handleTopUp}
                disabled={loading || topUpAmount > dailyRemaining}
                className="w-full"
              >
                {loading ? "Processing..." : `Add ${topUpAmount} Coins`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}


