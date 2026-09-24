import { useQuery } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

/** Unread notification count for the badge. useLiveUpdates refreshes it when a new one arrives. */
export function useUnreadCount() {
  const { session } = useSession();
  const { data } = useQuery({
    queryKey: ['notifications', 'unread', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .is('read_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
  return data ?? 0;
}
