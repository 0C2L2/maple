import { createClient } from '@supabase/supabase-js';

import { sessionStorageAdapter } from '@/lib/storage';

// Defaults point at the local stack (`npx supabase start`); set both in client/.env.local for a cloud project.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'missing-publishable-key';

export const supabase = createClient(url, key, {
  auth: {
    storage: sessionStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Supabase errors carry a Postgres code; turn the ones users can hit into plain sentences.
export function errorMessage(error: unknown): string {
  const e = error as { code?: string; message?: string };
  if (e?.code === '23505') return 'That already exists.';
  if (e?.code === '23514') return 'Some details are invalid. Check the fields and try again.';
  if (e?.code === '42501') return e.message?.startsWith('new row') ? "You can't do that." : e.message ?? "You can't do that.";
  if (/failed to fetch|network/i.test(e?.message ?? '')) return "Can't reach Maple. Check your connection and try again.";
  return e?.message || 'Something went wrong. Please try again.';
}
