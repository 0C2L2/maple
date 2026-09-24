import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';

// One Realtime channel for the signed-in user. Every proposal, message, follow, and review aimed at them
// creates a notification (database triggers), so this refreshes the badge, inbox, and proposals together.
export function useLiveUpdates() {
  const queryClient = useQueryClient();
  const me = useSession().session?.user.id;

  useEffect(() => {
    if (!me) return;
    const channel = supabase
      // Unique topic: a quick remount would otherwise get the old, already-subscribed channel back and throw.
      .channel(`notifications:${me}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${me}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['threads', 'list'] });
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [me, queryClient]);
}
