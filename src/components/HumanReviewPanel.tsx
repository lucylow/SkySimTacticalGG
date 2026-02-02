// src/components/HumanReviewPanel.tsx
import { useEffect, useState } from 'react';
import { unifiedApi } from '@/services/unifiedApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, MessageSquare, AlertCircle, Clock } from 'lucide-react';

type Review = {
  id: number;
  review_id: string;
  run_id: string;
  agent_name: string;
  reason?: string;
  status: string;
  assigned_to?: string;
  metadata?: {
    agent_meta?: {
      result?: unknown;
    };
  };
  final_result?: unknown;
  created_at: string;
};

export function HumanReviewPanel() {
  const [pending, setPending] = useState<Review[]>([]);
  const [selected, setSelected] = useState<Review | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  // Use improved WebSocket hook
  useWebSocket(unifiedApi.getWebSocketUrl(), {
    onMessage: (message) => {
      if (message.event === 'human_review.created' || message.event === 'review.created') {
        void fetchPending();
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  useEffect(() => {
    void fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const reviews = await unifiedApi.listPendingReviews(50);
      setPending(reviews as Review[]);
    } catch (err) {
      console.error('Failed to fetch pending reviews:', err);
    } finally {
      setLoading(false);
    }
  }

  function openReview(review: Review) {
    setSelected(review);
    setCommentText('');
  }

  async function approve(finalResult?: unknown) {
    if (!selected) return;
    setLoading(true);
    try {
      await unifiedApi.reviewAction(selected.review_id, 'approve', {
        final_result: finalResult || selected.metadata?.agent_meta?.result,
      });
      setSelected(null);
      void fetchPending();
    } catch (err) {
      console.error('Failed to approve review:', err);
      alert('Failed to approve review. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function reject() {
    if (!selected) return;
    setLoading(true);
    try {
      await unifiedApi.reviewAction(selected.review_id, 'reject', {});
      setSelected(null);
      void fetchPending();
    } catch (err) {
      console.error('Failed to reject review:', err);
      alert('Failed to reject review. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function requestEdit() {
    if (!selected) return;
    setLoading(true);
    try {
      await unifiedApi.reviewAction(selected.review_id, 'request_edit', {});
      setSelected(null);
      void fetchPending();
    } catch (err) {
      console.error('Failed to request edit:', err);
      alert('Failed to request edit. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  async function comment() {
    if (!selected || !commentText.trim()) return;
    setLoading(true);
    try {
      await unifiedApi.addReviewComment(selected.review_id, commentText);
      setCommentText('');
      alert('Comment added successfully');
    } catch (err) {
      console.error('Failed to add comment:', err);
      alert('Failed to add comment. Check console for details.');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'default',
      in_progress: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      escalated: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  }

  return (
    <div className="flex gap-6 h-full">
      <div className="w-80 border-r">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Reviews ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              {loading && pending.length === 0 ? (
                <div className="text-sm text-muted-foreground">Loading...</div>
              ) : pending.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pending reviews</div>
              ) : (
                <div className="space-y-2">
                  {pending.map((r) => (
                    <Card
                      key={r.review_id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        selected?.review_id === r.review_id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => openReview(r)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{r.agent_name}</span>
                            {getStatusBadge(r.status)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.reason || 'Auto review'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Run: {r.run_id.slice(0, 8)}...
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="flex-1">
        {selected ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Review {selected.review_id.slice(0, 16)}...</CardTitle>
                {getStatusBadge(selected.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Agent</div>
                  <div className="text-sm">{selected.agent_name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Run ID</div>
                  <div className="text-sm font-mono">{selected.run_id}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Reason</div>
                  <div className="text-sm">{selected.reason || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Created</div>
                  <div className="text-sm">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Metadata & Result</div>
                <ScrollArea className="h-64 border rounded-md p-4 bg-muted/50">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </ScrollArea>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium mb-2">Add Comment</div>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment about this review..."
                  className="min-h-[80px]"
                />
                <Button
                  onClick={() => {
                    void comment();
                  }}
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  disabled={loading || !commentText.trim()}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Add Comment
                </Button>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    void approve();
                  }}
                  variant="default"
                  disabled={loading}
                  className="flex-1"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    void reject();
                  }}
                  variant="destructive"
                  disabled={loading}
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    void requestEdit();
                  }}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Request Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px]">
              <div className="text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a review from the list to inspect</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
