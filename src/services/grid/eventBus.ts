// Event Bus - In-memory implementation (replaces Redis for frontend)
// Provides pub/sub and stream-like functionality

import type { CanonicalEvent, RawGridEvent, AgentSignal } from '@/types/grid';

type EventListener<T> = (event: T) => void;
type StreamListener = (events: CanonicalEvent[]) => void;

class EventBus {
  // Raw events storage
  private rawEvents: RawGridEvent[] = [];
  
  // Canonical events storage
  private canonicalEvents: CanonicalEvent[] = [];
  
  // Agent signals storage
  private agentSignals: AgentSignal[] = [];
  private reviewQueue: AgentSignal[] = [];
  
  // Subscribers
  private canonicalSubscribers: Set<EventListener<CanonicalEvent>> = new Set();
  private rawSubscribers: Set<EventListener<RawGridEvent>> = new Set();
  private signalSubscribers: Set<EventListener<AgentSignal>> = new Set();
  private reviewSubscribers: Set<EventListener<AgentSignal>> = new Set();
  
  // Stream listeners (for replay)
  private streamListeners: Set<StreamListener> = new Set();

  /**
   * Publish a raw event
   */
  publishRaw(event: RawGridEvent): void {
    this.rawEvents.push(event);
    this.rawSubscribers.forEach((sub) => sub(event));
  }

  /**
   * Publish a canonical event
   */
  publishCanonical(event: CanonicalEvent): void {
    this.canonicalEvents.push(event);
    this.canonicalSubscribers.forEach((sub) => sub(event));
    
    // Notify stream listeners
    this.streamListeners.forEach((listener) => {
      listener([event]);
    });
  }

  /**
   * Publish an agent signal
   */
  publishSignal(signal: AgentSignal): void {
    if (signal.status === 'PENDING_REVIEW') {
      this.reviewQueue.push(signal);
      this.reviewSubscribers.forEach((sub) => sub(signal));
    } else {
      this.agentSignals.push(signal);
      this.signalSubscribers.forEach((sub) => sub(signal));
    }
  }

  /**
   * Subscribe to canonical events
   */
  subscribeCanonical(listener: EventListener<CanonicalEvent>): () => void {
    this.canonicalSubscribers.add(listener);
    return () => this.canonicalSubscribers.delete(listener);
  }

  /**
   * Subscribe to raw events
   */
  subscribeRaw(listener: EventListener<RawGridEvent>): () => void {
    this.rawSubscribers.add(listener);
    return () => this.rawSubscribers.delete(listener);
  }

  /**
   * Subscribe to agent signals
   */
  subscribeSignals(listener: EventListener<AgentSignal>): () => void {
    this.signalSubscribers.add(listener);
    return () => this.signalSubscribers.delete(listener);
  }

  /**
   * Subscribe to review queue
   */
  subscribeReview(listener: EventListener<AgentSignal>): () => void {
    this.reviewSubscribers.add(listener);
    return () => this.reviewSubscribers.delete(listener);
  }

  /**
   * Subscribe to event stream (for replay)
   */
  subscribeStream(listener: StreamListener): () => void {
    this.streamListeners.add(listener);
    return () => this.streamListeners.delete(listener);
  }

  /**
   * Get all canonical events (for replay)
   */
  getAllCanonicalEvents(): CanonicalEvent[] {
    return [...this.canonicalEvents];
  }

  /**
   * Get canonical events for a specific match
   */
  getMatchEvents(matchId: string): CanonicalEvent[] {
    return this.canonicalEvents.filter((e) => e.match_id === matchId);
  }

  /**
   * Get all agent signals
   */
  getAllSignals(): AgentSignal[] {
    return [...this.agentSignals];
  }

  /**
   * Get signals for a specific match
   */
  getMatchSignals(matchId: string): AgentSignal[] {
    return this.agentSignals.filter((s) => s.match_id === matchId);
  }

  /**
   * Get review queue
   */
  getReviewQueue(): AgentSignal[] {
    return [...this.reviewQueue];
  }

  /**
   * Approve a signal (move from review to approved)
   */
  approveSignal(signalId: string, reviewedBy: string): void {
    const signal = this.reviewQueue.find((s) => s.id === signalId);
    if (signal) {
      signal.status = 'APPROVED';
      signal.reviewed_by = reviewedBy;
      signal.reviewed_at = new Date().toISOString();
      this.reviewQueue = this.reviewQueue.filter((s) => s.id !== signalId);
      this.agentSignals.push(signal);
      this.signalSubscribers.forEach((sub) => sub(signal));
    }
  }

  /**
   * Reject a signal
   */
  rejectSignal(signalId: string, reviewedBy: string): void {
    const signal = this.reviewQueue.find((s) => s.id === signalId);
    if (signal) {
      signal.status = 'REJECTED';
      signal.reviewed_by = reviewedBy;
      signal.reviewed_at = new Date().toISOString();
      this.reviewQueue = this.reviewQueue.filter((s) => s.id !== signalId);
    }
  }

  /**
   * Clear all events (for testing/reset)
   */
  clear(): void {
    this.rawEvents = [];
    this.canonicalEvents = [];
    this.agentSignals = [];
    this.reviewQueue = [];
  }
}

export const eventBus = new EventBus();


