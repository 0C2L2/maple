import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { useFocusEffect } from 'expo-router';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useSession } from '@/providers/SessionProvider';
import { getMyOrganizationMembership, type Organization } from '@/features/organizations/data';
import { getEventBySlug, type Event } from './data';
type State = { event: Event | null; organization: Organization | null; canManage: boolean; loading: boolean; error: string | null };
const empty: State = { event: null, organization: null, canManage: false, loading: true, error: null };
const Context = createContext<(State & { retry: () => void; setEvent: (event: Event) => void }) | null>(null);
export function EventProvider({ slug, children }: PropsWithChildren<{ slug: string }>) {
  const { profile } = useSession();
  const [state, setState] = useState<State>(empty);
  const [attempt, setAttempt] = useState(0);
  const id = profile?.id, role = profile?.role;
  useFocusEffect(useCallback(() => {
    let active = true;
    void attempt;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setState(empty);
      try {
        const event = await getEventBySlug(slug);
        if (!event) { if (active) setState({ ...empty, loading: false }); return; }
        const { data: organization, error } = await getSupabaseClient().from('organizations').select('*').eq('id', event.org_id).single();
        if (error) throw error;
        const membership = id && role === 'organizer' ? await getMyOrganizationMembership(event.org_id) : null;
        if (active) setState({ event, organization, canManage: role === 'organizer' && membership?.role === 'admin', loading: false, error: null });
      } catch { if (active) setState({ ...empty, loading: false, error: 'We could not load this event and your permission. Please retry.' }); }
    });
    return () => { active = false; };
  }, [slug, id, role, attempt]));
  return <Context.Provider value={{ ...state, retry: () => setAttempt(n => n + 1), setEvent: event => setState(current => ({ ...current, event })) }}>{children}</Context.Provider>;
}
export function useEvent() {
  const state = useContext(Context);
  if (!state) throw new Error('Event provider is required.');
  return state;
}
