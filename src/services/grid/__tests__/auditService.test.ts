import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auditService } from '../auditService';
import { supabase } from '@/integrations/supabase/client';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log an action successfully', async () => {
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
    (supabase.from as any).mockReturnValue({ insert: insertSpy });

    await auditService.log({
      provider: 'grid',
      resourceId: 'match-123',
      action: 'test_action',
      status: 'success',
      message: 'Test message',
    });

    expect(supabase.from).toHaveBeenCalledWith('grid_ingest_audit');
    expect(insertSpy).toHaveBeenCalledWith({
      provider: 'grid',
      provider_resource_id: 'match-123',
      action: 'test_action',
      status: 'success',
      message: 'Test message',
      raw: null,
    });
  });

  it('should log summary success', async () => {
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
    (supabase.from as any).mockReturnValue({ insert: insertSpy });

    await auditService.logSummarySuccess('match-123');

    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
      action: 'summary_compute',
      status: 'success',
      provider_resource_id: 'match-123',
    }));
  });

  it('should log summary failure', async () => {
    const insertSpy = vi.fn(() => Promise.resolve({ error: null }));
    (supabase.from as any).mockReturnValue({ insert: insertSpy });

    await auditService.logSummaryFailure('match-123', 'Some error');

    expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
      action: 'summary_compute',
      status: 'failure',
      message: 'Some error',
    }));
  });

  it('should handle insert errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const insertSpy = vi.fn(() => Promise.resolve({ error: { message: 'DB Error' } }));
    (supabase.from as any).mockReturnValue({ insert: insertSpy });

    await auditService.log({
      provider: 'grid',
      resourceId: 'match-123',
      action: 'test_action',
      status: 'success',
      message: 'Test message',
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AUDIT ERROR]'),
      expect.anything()
    );
    consoleErrorSpy.mockRestore();
  });
});
