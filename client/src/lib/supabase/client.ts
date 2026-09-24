import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import type { Database } from '@/types/database';
import { getSessionStorage } from './storage';

let client: SupabaseClient<Database> | undefined;
export function getSupabaseClient() {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo.');
  const runtime = Platform.OS !== 'web' || typeof window !== 'undefined';
  client = createClient<Database>(url, key, {
    auth: {
      storage: runtime ? getSessionStorage() : undefined,
      persistSession: runtime,
      autoRefreshToken: runtime,
      detectSessionInUrl: false,
    },
  });
  return client;
}
