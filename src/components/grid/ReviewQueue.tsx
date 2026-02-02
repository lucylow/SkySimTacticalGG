// Review Queue Component - Human-in-the-loop review workflow

import { useReviewQueue } from '@/hooks/useReviewQueue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewQueue() {
  const { queue, canReview, approve, reject } = useReviewQueue();

  const handleApprove = (signalId: string) => {
    try {
      approve(signalId);
      toast.success('Signal approved');
    } catch {
      toast.error('Failed to approve signal');
    }
  };

  const handleReject = (signalId: string) => {
    try {
      reject(signalId);
      toast.success('Signal rejected');
    } catch {
      toast.error('Failed to reject signal');
    }
  };

  if (!canReview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Review Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You don't have permission to review signals. Please log in as a reviewer.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Review Queue</span>
          <Badge variant="secondary">{queue.length} pending</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No signals pending review.
              </p>
            ) : (
              queue.map((signal) => (
                <ReviewCard
                  key={signal.id}
                  signal={signal}
                  onApprove={() => handleApprove(signal.id)}
                  onReject={() => handleReject(signal.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function ReviewCard({
  signal,
  onApprove,
  onReject,
}: {
  signal: any;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{signal.type}</Badge>
            <Badge variant="secondary" className="text-xs">
              {Math.round(signal.confidence * 100)}% confidence
            </Badge>
            {signal.team && (
              <Badge variant="secondary" className="text-xs">
                {signal.team}
              </Badge>
            )}
          </div>
          <div className="text-sm space-y-1">
            {Object.entries((signal.explanation as Record<string, unknown>) || {}).map(
              ([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-medium">
                    {typeof value === 'number' ? value.toFixed(2) : String(value)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={onApprove} className="flex-1">
          <Check className="w-4 h-4 mr-2" />
          Approve
        </Button>
        <Button size="sm" variant="destructive" onClick={onReject} className="flex-1">
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      </div>
    </div>
  );
}
