import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

/** True for Maple staff (public.staff). The database re-checks on every admin action. */
export function useIsStaff() {
  const { session } = useSession();
  const { data, isPending } = useQuery({
    queryKey: ['staff', 'me', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_staff');
      if (error) throw error;
      return data as boolean;
    },
  });
  return { isStaff: !!data, checking: !!session && isPending };
}
