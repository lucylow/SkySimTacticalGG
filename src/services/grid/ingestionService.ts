// GRID Ingestion Service - Main orchestrator
// Handles the full pipeline: GRID → Normalize → Event Bus → State → Agents

import { gridClient } from './gridClient';
import { eventNormalizer } from './eventNormalizer';
import { eventBus } from './eventBus';
import { matchStateEngine } from './matchState';
import { agentService } from './agentService';
import type { RawGridEvent, CanonicalEvent } from '@/types/grid';
import { GridNormalizationError, GridStateError } from '@/types/grid';

export class IngestionError extends Error {
  constructor(
    message: string,
    public readonly matchId: string | null,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'IngestionError';
  }
}

export class IngestionService {
  private isIngesting = false;
  private currentMatchId: string | null = null;
  private errorCount = 0;
  private readonly maxErrors = 10; // Max consecutive errors before stopping
  private readonly maxRetries = 3; // Max retries for transient errors

  /**
   * Start ingesting a match
   */
  async ingestMatch(matchId: string): Promise<void> {
    // Validate matchId
    if (!matchId || typeof matchId !== 'string' || matchId.trim().length === 0) {
      throw new IngestionError('Invalid matchId: must be a non-empty string', null);
    }

    if (this.isIngesting) {
      if (this.currentMatchId === matchId) {
        console.warn(`Ingestion already in progress for match ${matchId}`);
        return;
      } else {
        throw new IngestionError(
          `Ingestion already in progress for match ${this.currentMatchId}. Cannot start ingestion for ${matchId}`,
          this.currentMatchId
        );
      }
    }

    this.isIngesting = true;
    this.currentMatchId = matchId;
    this.errorCount = 0;

    try {
      // Start agent for this match
      try {
        agentService.start(matchId);
      } catch (error) {
        throw new IngestionError(
          `Failed to start agent service: ${error instanceof Error ? error.message : String(error)}`,
          matchId,
          error instanceof Error ? error : undefined
        );
      }

      // Subscribe to GRID stream
      let stream: AsyncGenerator<RawGridEvent>;
      try {
        stream = await gridClient.subscribe(matchId);
      } catch (error) {
        throw new IngestionError(
          `Failed to subscribe to GRID stream: ${error instanceof Error ? error.message : String(error)}`,
          matchId,
          error instanceof Error ? error : undefined
        );
      }

      // Process events
      for await (const rawEvent of stream) {
        try {
          // Validate raw event before processing
          if (!rawEvent || typeof rawEvent !== 'object') {
            throw new IngestionError('Raw event is not an object', matchId);
          }

          // Store raw event
          try {
            eventBus.publishRaw(rawEvent);
          } catch (error) {
            console.error('Failed to publish raw event:', error);
            // Continue processing even if publish fails
          }

          // Normalize event with retry logic
          let canonicalEvent: CanonicalEvent;
          let retryCount = 0;
          while (retryCount < this.maxRetries) {
            try {
              canonicalEvent = eventNormalizer.normalize(rawEvent);
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              if (error instanceof GridNormalizationError) {
                // Don't retry validation errors
                throw error;
              }
              if (retryCount >= this.maxRetries) {
                throw new IngestionError(
                  `Failed to normalize event after ${this.maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`,
                  matchId,
                  error instanceof Error ? error : undefined
                );
              }
              // Wait before retry (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
            }
          }

          // Publish canonical event
          try {
            eventBus.publishCanonical(canonicalEvent!);
          } catch (error) {
            console.error('Failed to publish canonical event:', error);
            // Continue processing even if publish fails
          }

          // Update match state with retry logic
          retryCount = 0;
          while (retryCount < this.maxRetries) {
            try {
              matchStateEngine.processEvent(canonicalEvent!);
              this.errorCount = 0; // Reset error count on success
              break; // Success, exit retry loop
            } catch (error) {
              retryCount++;
              if (error instanceof GridStateError) {
                // Don't retry state errors (they're usually data issues)
                this.errorCount++;
                if (this.errorCount >= this.maxErrors) {
                  throw new IngestionError(
                    `Too many consecutive errors (${this.errorCount}). Stopping ingestion.`,
                    matchId,
                    error
                  );
                }
                console.error(`State processing error (${this.errorCount}/${this.maxErrors}):`, error);
                break; // Skip this event but continue
              }
              if (retryCount >= this.maxRetries) {
                this.errorCount++;
                if (this.errorCount >= this.maxErrors) {
                  throw new IngestionError(
                    `Too many consecutive errors (${this.errorCount}). Stopping ingestion.`,
                    matchId,
                    error instanceof Error ? error : undefined
                  );
                }
                console.error(`Failed to process event after ${this.maxRetries} attempts:`, error);
                break; // Skip this event but continue
              }
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retryCount - 1)));
            }
          }
        } catch (error) {
          this.errorCount++;
          
          if (error instanceof IngestionError) {
            throw error; // Re-throw ingestion errors
          }

          if (this.errorCount >= this.maxErrors) {
            throw new IngestionError(
              `Too many consecutive errors (${this.errorCount}). Stopping ingestion.`,
              matchId,
              error instanceof Error ? error : undefined
            );
          }

          // Log error but continue processing
          console.error(`Error processing event (${this.errorCount}/${this.maxErrors}):`, error);
          
          // If it's a critical error, we might want to stop
          if (error instanceof GridNormalizationError || error instanceof GridStateError) {
            // These are data validation errors - log but continue
            console.warn('Data validation error, skipping event:', error.message);
          }
        }
      }
    } catch (error) {
      if (error instanceof IngestionError) {
        throw error;
      }
      throw new IngestionError(
        `Ingestion error: ${error instanceof Error ? error.message : String(error)}`,
        matchId,
        error instanceof Error ? error : undefined
      );
    } finally {
      this.isIngesting = false;
      this.currentMatchId = null;
      this.errorCount = 0;
      
      // Stop agent service
      try {
        agentService.stop();
      } catch (error) {
        console.error('Error stopping agent service:', error);
      }
    }
  }

  /**
   * Stop ingestion
   */
  stop(): void {
    const matchId = this.currentMatchId;
    this.isIngesting = false;
    this.currentMatchId = null;
    this.errorCount = 0;
    
    if (matchId) {
      try {
        agentService.stop();
      } catch (error) {
        console.error('Error stopping agent service:', error);
      }
    }
  }

  /**
   * Check if ingestion is active
   */
  isActive(): boolean {
    return this.isIngesting;
  }

  /**
   * Get current match ID
   */
  getCurrentMatchId(): string | null {
    return this.currentMatchId;
  }
}

export const ingestionService = new IngestionService();

