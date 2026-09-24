import { useSession } from '@/providers/SessionProvider';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { getOrganizationBySlug, getMyOrganizationMembership, type Organization, type Membership } from './data';
type State = { organization: Organization | null; membership: Membership | null; loading: boolean; error: string | null };
const Context = createContext<(State & { setOrganization: (row: Organization) => void; retry: () => void }) | null>(null);
export function OrganizationProvider({ slug, children }: PropsWithChildren<{ slug: string }>) {
  const { session } = useSession();
  const userId = session?.user.id;
  const [state, setState] = useState<State>({ organization: null, membership: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void getOrganizationBySlug(slug).then(async (organization) => {
      const membership = organization && userId ? await getMyOrganizationMembership(organization.id) : null;
      if (active) setState({ organization, membership, loading: false, error: null });
    }).catch(() => { if (active) setState({ organization: null, membership: null, loading: false, error: 'We could not load the organization and your membership. Please retry.' }); });
    return () => { active = false; };
  }, [slug, attempt, userId]);
  return <Context.Provider value={{ ...state, setOrganization: (organization) => setState((current) => ({ ...current, organization })), retry: () => { setState((current) => ({ ...current, loading: true, error: null })); setAttempt((n) => n + 1); } }}>{children}</Context.Provider>;
}
export function useOrganization() {
  const context = useContext(Context);
  if (!context) throw new Error('Organization provider is required.');
  return context;
}
