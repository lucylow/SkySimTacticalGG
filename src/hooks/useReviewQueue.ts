// React hook for review queue management

import { useEffect, useState } from 'react';
import { reviewService } from '@/services/grid';
import type { AgentSignal } from '@/types/grid';

export function useReviewQueue() {
  const [queue, setQueue] = useState<AgentSignal[]>([]);
  const [canReview, setCanReview] = useState(false);

  useEffect(() => {
    setCanReview(reviewService.canReview());

    const unsubscribe = reviewService.subscribeReviewQueue((signals) => {
      setQueue(signals);
    });

    return unsubscribe;
  }, []);

  const approve = (signalId: string) => {
    try {
      reviewService.approveSignal(signalId);
    } catch (error) {
      console.error('Failed to approve signal:', error);
      throw error;
    }
  };

  const reject = (signalId: string) => {
    try {
      reviewService.rejectSignal(signalId);
    } catch (error) {
      console.error('Failed to reject signal:', error);
      throw error;
    }
  };

  return {
    queue,
    canReview,
    approve,
    reject,
  };
}


