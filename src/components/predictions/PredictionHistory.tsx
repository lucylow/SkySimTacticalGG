// components/predictions/PredictionHistory.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, X } from "lucide-react";
import { predictionsApi } from "@/services/predictionsApi";
import { useToast } from "@/hooks/use-toast";
import type { Prediction } from "@/types/predictions";

interface PredictionHistoryProps {
  predictions: Prediction[];
  onUpdate: () => void;
}

export function PredictionHistory({ predictions, onUpdate }: PredictionHistoryProps) {
  const { toast } = useToast();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "won":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "lost":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "won":
        return <Badge variant="default" className="bg-green-500">Won</Badge>;
      case "lost":
        return <Badge variant="destructive">Lost</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancel = async (predictionId: string) => {
    try {
      await predictionsApi.cancelPrediction(predictionId);
      toast({
        title: "Prediction cancelled",
        description: "Your stake has been refunded",
      });
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel prediction",
        variant: "destructive",
      });
    }
  };

  if (predictions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No predictions yet. Place your first prediction!
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {predictions.map((pred) => (
        <Card key={pred.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(pred.status)}
                  <span className="font-medium">{pred.selection}</span>
                  {getStatusBadge(pred.status)}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Market: {pred.market?.market_type || `Market #${pred.market_id}`}</p>
                  <p>Stake: {pred.stake} coins</p>
                  {pred.odds && <p>Odds: {pred.odds}</p>}
                  {pred.status === "won" && pred.payout && (
                    <p className="text-green-600 font-medium">Payout: {pred.payout} coins</p>
                  )}
                  {pred.status === "pending" && (
                    <p className="text-yellow-600">Potential: {pred.potential_payout} coins</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(pred.created_at).toLocaleString()}
                </p>
              </div>
              {pred.status === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancel(pred.prediction_id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


