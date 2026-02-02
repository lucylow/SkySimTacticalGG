// Review Service - Human-in-the-loop workflow for agent signals

import { eventBus } from './eventBus';
import type { AgentSignal } from '@/types/grid';

export type UserRole = 'viewer' | 'reviewer' | 'admin';

export class ReviewService {
  private currentUser: { id: string; role: UserRole } | null = null;

  /**
   * Set current user
   */
  setUser(userId: string, role: UserRole): void {
    this.currentUser = { id: userId, role };
  }

  /**
   * Get current user
   */
  getCurrentUser(): { id: string; role: UserRole } | null {
    return this.currentUser;
  }

  /**
   * Check if user can review
   */
  canReview(): boolean {
    return this.currentUser?.role === 'reviewer' || this.currentUser?.role === 'admin';
  }

  /**
   * Approve a signal
   */
  approveSignal(signalId: string): void {
    if (!this.canReview()) {
      throw new Error('User does not have permission to review');
    }

    if (!this.currentUser) {
      throw new Error('No user set');
    }

    eventBus.approveSignal(signalId, this.currentUser.id);
  }

  /**
   * Reject a signal
   */
  rejectSignal(signalId: string): void {
    if (!this.canReview()) {
      throw new Error('User does not have permission to review');
    }

    if (!this.currentUser) {
      throw new Error('No user set');
    }

    eventBus.rejectSignal(signalId, this.currentUser.id);
  }

  /**
   * Get review queue
   */
  getReviewQueue(): AgentSignal[] {
    return eventBus.getReviewQueue();
  }

  /**
   * Subscribe to review queue changes
   */
  subscribeReviewQueue(listener: (signals: AgentSignal[]) => void): () => void {
    const unsubscribe = eventBus.subscribeReview((signal) => {
      listener(eventBus.getReviewQueue());
    });

    // Initial call
    listener(eventBus.getReviewQueue());

    return unsubscribe;
  }
}

export const reviewService = new ReviewService();


