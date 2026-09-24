import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase/client';

type SessionState = {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
};
const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    let cleanup: (() => void) | undefined;
    void Promise.resolve().then(() => {
      if (!alive) return;
      let client: ReturnType<typeof getSupabaseClient>;
      try { client = getSupabaseClient(); }
      catch {
        setError('Auth configuration is unavailable. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, then restart Expo.');
        setLoading(false);
        return;
      }
      let eventReceived = false;
      setLoading(true);
      setError(null);
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
        if (!alive || _event === 'INITIAL_SESSION') return;
        eventReceived = true;
        setSession(nextSession);
        setError(null);
        setLoading(false);
      });
      void client.auth.getSession().then(({ data, error: restoreError }) => {
        if (!alive || eventReceived) return;
        if (restoreError) throw restoreError;
        setSession(data.session);
        setLoading(false);
      }).catch(() => {
        if (!alive || eventReceived) return;
        setError('Your session could not be restored. Check your connection and browser storage, then retry.');
        setLoading(false);
      });
      const refresh = (state: string) => {
        if (state === 'active') void client.auth.startAutoRefresh();
        else void client.auth.stopAutoRefresh();
      };
      const listener = Platform.OS !== 'web' ? AppState.addEventListener('change', refresh) : undefined;
      if (Platform.OS !== 'web') refresh(AppState.currentState);
      cleanup = () => {
        subscription.unsubscribe();
        listener?.remove();
        if (Platform.OS !== 'web') void client.auth.stopAutoRefresh();
      };
    });
    return () => { alive = false; cleanup?.(); };
  }, [attempt]);

  async function signOut() {
    const { error: signOutError } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    if (signOutError) throw signOutError;
  }
  return <SessionContext.Provider value={{ session, user: session?.user ?? null, loading, error, retry: () => { setLoading(true); setError(null); setAttempt((value) => value + 1); }, signOut }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be inside SessionProvider');
  return context;
}
