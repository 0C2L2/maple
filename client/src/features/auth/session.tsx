import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { AttendanceBand, AudienceType, BudgetBand, Category, Give, OrgKind, Role } from '@/constants/taxonomy';
import { supabase } from '@/lib/supabase';

/** An organization page. Every Maple account is one organization (D-025). */
export type Organization = {
  id: string;
  role: Role;
  kind: OrgKind;
  handle: string;
  name: string;
  tagline: string | null;
  about: string | null;
  location: string | null;
  website: string | null;
  logo_url: string | null;
  banner_url: string | null;
  categories: Category[];
  regions: string[];
  audience_types: AudienceType[];
  attendance_band: AttendanceBand | null;
  budget_band: BudgetBand | null;
  gives: Give[];
  created_at: string;
};

type SessionState = {
  session: Session | null;
  /** The signed-in account's organization; null until onboarding creates it. */
  org: Organization | null;
  /** True until we know whether someone is signed in (and, if so, whether their organization exists). */
  isLoading: boolean;
  refreshOrg: () => Promise<unknown>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Only on a real sign-out: clearing also cancels in-flight queries, and signed-out visitors get a
      // null INITIAL_SESSION event on every page load.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id;
  const org = useQuery({
    queryKey: ['organizations', 'me', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').eq('id', userId!).maybeSingle();
      if (error) throw error;
      return data as Organization | null;
    },
  });

  const value: SessionState = {
    session,
    org: org.data ?? null,
    isLoading: !checked || (!!userId && org.isPending),
    refreshOrg: org.refetch,
  };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
