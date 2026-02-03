import { supabase } from '../../integrations/supabase/client';

export type AuditStatus = 'ok' | 'failed' | 'success' | 'failure';

export interface AuditLogParams {
  provider: string;
  resourceId: string;
  action: string;
  status: AuditStatus;
  message: string;
  raw?: any;
}

/**
 * Centralized service for audit logging related to GRID ingestion and processing.
 */
export const auditService = {
  /**
   * Logs an action to the grid_ingest_audit table.
   */
  async log(params: AuditLogParams) {
    try {
      const { error } = await supabase.from('grid_ingest_audit').insert({
        provider: params.provider,
        provider_resource_id: params.resourceId,
        action: params.action,
        status: params.status,
        message: params.message,
        raw: params.raw || null,
      });

      if (error) {
        console.error(`[AUDIT ERROR] Failed to insert audit log for ${params.resourceId}:`, error);
      }
    } catch (err) {
      console.error(`[CRITICAL] Exception while marking ${params.resourceId} in audit log:`, err);
    }
  },

  /**
   * Helper for summary computation successes.
   */
  async logSummarySuccess(matchId: string, message = 'Summary computed successfully') {
    return this.log({
      provider: 'grid',
      resourceId: matchId,
      action: 'summary_compute',
      status: 'success',
      message,
    });
  },

  /**
   * Helper for summary computation failures.
   */
  async logSummaryFailure(matchId: string, error: string) {
    return this.log({
      provider: 'grid',
      resourceId: matchId,
      action: 'summary_compute',
      status: 'failure',
      message: error,
    });
  }
};
