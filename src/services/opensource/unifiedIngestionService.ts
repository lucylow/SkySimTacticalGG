// Unified Ingestion Service
// Combines GRID and open source esports data streams

import { gridClient } from '../grid/gridClient';
import { opensourceEsportsClient, type OpenSourceMatch } from './opensourceEsportsClient';
import { eventBus, eventNormalizer } from '../grid';
import type { RawGridEvent } from '@/types/grid';

export class UnifiedIngestionService {
  private isRunning = false;
  private unsubscribeGrid?: () => void;
  private unsubscribeOpenSource?: () => void;

  /**
   * Start unified ingestion from both GRID and open source APIs
   */
  start(matchId: string): void {
    if (this.isRunning) {
      console.warn('Unified ingestion already running');
      return;
    }

    this.isRunning = true;

    // Start GRID stream
    (async () => {
      try {
        const gridStream = gridClient.subscribe(matchId);
        this.unsubscribeGrid = () => {
          // Grid client doesn't have unsubscribe, but we can track it
          console.warn('Stopped GRID stream');
        };

        // Process GRID events
        for await (const event of gridStream) {
          this.processGridEvent(event);
        }
      } catch (error) {
        console.error('Error starting GRID stream:', error);
      }
    })().catch((error) => {
      console.error('Error in GRID stream processing:', error);
    });

    // Start open source polling
    this.unsubscribeOpenSource = opensourceEsportsClient.subscribe((match: OpenSourceMatch) => {
      void this.processOpenSourceMatch(match);
    });

    console.warn('Unified ingestion started');
  }

  /**
   * Stop unified ingestion
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.unsubscribeGrid) {
      this.unsubscribeGrid();
    }

    if (this.unsubscribeOpenSource) {
      this.unsubscribeOpenSource();
    }

    console.warn('Unified ingestion stopped');
  }

  /**
   * Process GRID event
   */
  private processGridEvent(event: RawGridEvent): void {
    try {
      // Normalize and publish to event bus
      const canonical = eventNormalizer.normalize(event);
      eventBus.publishCanonical(canonical);
    } catch (error) {
      console.error('Error processing GRID event:', error);
    }
  }

  /**
   * Process open source match
   */
  private processOpenSourceMatch(match: OpenSourceMatch): void {
    try {
      // Convert to GRID-like format
      const gridEvent = opensourceEsportsClient.convertToGridEvent(match);

      // Normalize and publish to event bus
      const canonical = eventNormalizer.normalize(gridEvent);
      eventBus.publishCanonical(canonical);

      console.warn(`Processed ${match.source} match: ${match.match_id}`);
    } catch (error) {
      console.error('Error processing open source match:', error);
    }
  }

  /**
   * Get statistics about data sources
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      sources: {
        grid: this.unsubscribeGrid !== undefined,
        opensource: this.unsubscribeOpenSource !== undefined,
      },
    };
  }
}

export const unifiedIngestionService = new UnifiedIngestionService();
