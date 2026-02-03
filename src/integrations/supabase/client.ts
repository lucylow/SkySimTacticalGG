// Centralized Supabase client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config } from '@/lib/config';

// Resolve Supabase URL from envs (prefer explicit URL, else derive from project id)
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
const ENV_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_URL = ENV_URL || (PROJECT_ID ? `https://${PROJECT_ID}.supabase.co` : undefined);

// Resolve publishable anon key
const ENV_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
// As a last resort, keep legacy hardcoded key to avoid breaking local demos
const LEGACY_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd29zZWZzeGRucmlncGRnZWhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjk0MDcsImV4cCI6MjA4NTY0NTQwN30.9Q4Fyr2TUt4T6VCIa8V4mbgsCoImmqwZeu1Nzziofpg";
const SUPABASE_PUBLISHABLE_KEY = ENV_ANON || LEGACY_ANON;

// Provide a safe storage for non-browser environments (e.g., Node workers)
const isBrowser = typeof window !== 'undefined' && !!window.localStorage;
const safeStorage: Storage | undefined = isBrowser ? window.localStorage : undefined;

function assertSupabaseConfigured() {
  if (!SUPABASE_URL) {
    const msg = 'Supabase URL is not configured. Set VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID.';
    if (config.enableMockData) {
      console.info(`[Supabase] ${msg} Running in mock mode.`);
      return;
    }
    throw new Error(msg);
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    const msg = 'Supabase anon key is not configured. Set VITE_SUPABASE_ANON_KEY.';
    if (config.enableMockData) {
      console.info(`[Supabase] ${msg} Running in mock mode.`);
      return;
    }
    throw new Error(msg);
  }
}

assertSupabaseConfigured();

export const supabase = SUPABASE_URL
  ? createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        // In Node (no window), don't use storage/persist to avoid ReferenceErrors and background timers
        storage: safeStorage,
        persistSession: !!safeStorage,
        autoRefreshToken: !!safeStorage,
      },
    })
  // @ts-expect-error Provide a minimal no-op client in strict mock mode to avoid import-time crashes
  : { from: () => ({ select: () => ({ data: null, error: new Error('Supabase disabled in mock mode') }) }) } as any;