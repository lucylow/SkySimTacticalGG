import { HumanReviewPanel } from '@/components/HumanReviewPanel';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';

export function HumanReview() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Human Review</h1>
            <p className="text-sm text-muted-foreground">
              Review and approve agent outputs requiring human oversight
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <HumanReviewPanel />
        </CardContent>
      </Card>
    </div>
  );
}

