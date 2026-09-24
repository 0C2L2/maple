import { getCurrentProfile, insertCurrentProfile, updateCurrentProfile, type Profile, type ProfileFields, type CreateProfileInput } from '@/features/profiles/data';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';
import { getSupabaseClient } from '@/lib/supabase/client';

type SessionState = {
  session: Session | null;
  user: Session['user'] | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  signOut: () => Promise<void>;
  profile: Profile | null; profileLoading: boolean; profileError: string | null; retryProfile: () => void;
  createProfile: (input: CreateProfileInput) => Promise<Profile>; updateProfile: (input: ProfileFields) => Promise<Profile>;
};
const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [profileState, setProfileState] = useState<{ owner: string | null; row: Profile | null; error: string | null; pending: boolean }>({ owner: null, row: null, error: null, pending: false });
  const [profileAttempt, setProfileAttempt] = useState(0);
  const profileGeneration = useRef(0);
  const currentUser = useRef<string | null>(null);
  const userId = session?.user.id ?? null;
  const profileLoading = !!userId && (profileState.owner !== userId || profileState.pending);
  const profile = profileState.owner === userId ? profileState.row : null;
  const profileError = profileState.owner === userId ? profileState.error : null;
  useEffect(() => {
    const generation = ++profileGeneration.current;
    let active = true;
    if (!userId) return;
    void getCurrentProfile().then((row) => {
      if (active && profileGeneration.current === generation && currentUser.current === userId) setProfileState({ owner: userId, row, error: null, pending: false });
    }).catch(() => {
      if (active && profileGeneration.current === generation && currentUser.current === userId) setProfileState({ owner: userId, row: null, error: 'We could not load your profile. Check your connection and retry.', pending: false });
    });
    return () => { active = false; };
  }, [userId, profileAttempt]);
  function retryProfile() {
    setProfileState({ owner: userId, row: null, error: null, pending: true });
    setProfileAttempt((value) => value + 1);
  }
  function acceptProfile(row: Profile) {
    if (currentUser.current !== row.id) throw new Error('Your session has changed. Please sign in again.');
    profileGeneration.current++;
    setProfileState({ owner: row.id, row, error: null, pending: false });
  }
  async function createProfile(input: CreateProfileInput) {
    const row = await insertCurrentProfile(input);
    acceptProfile(row);
    return row;
  }
  async function updateProfile(input: ProfileFields) {
    const row = await updateCurrentProfile(input);
    acceptProfile(row);
    return row;
  }

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
        currentUser.current = nextSession?.user.id ?? null;
        if (!nextSession) { profileGeneration.current++; setProfileState({ owner: null, row: null, error: null, pending: false }); }
        setSession(nextSession);
        setError(null);
        setLoading(false);
      });
      void client.auth.getSession().then(({ data, error: restoreError }) => {
        if (!alive || eventReceived) return;
        if (restoreError) throw restoreError;
        currentUser.current = data.session?.user.id ?? null;
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
  return <SessionContext.Provider value={{ profile, profileLoading, profileError, retryProfile, createProfile, updateProfile, session, user: session?.user ?? null, loading, error, retry: () => { setLoading(true); setError(null); setAttempt((value) => value + 1); }, signOut }}>{children}</SessionContext.Provider>;
}
export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be inside SessionProvider');
  return context;
}
