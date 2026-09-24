import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';

import { useSession } from '@/features/auth/session';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';

/** The ids of every organization the signed-in organization follows (one query shared by all buttons). */
export function useFollowing() {
  const { org } = useSession();
  return useQuery({
    queryKey: ['follows', 'mine', org?.id],
    enabled: !!org,
    queryFn: async () => {
      const { data, error } = await supabase.from('follows').select('org_id').eq('follower_id', org!.id);
      if (error) throw error;
      return new Set((data as { org_id: string }[]).map((row) => row.org_id));
    },
  });
}

export function FollowButton({ orgId }: { orgId: string }) {
  const { org } = useSession();
  const queryClient = useQueryClient();
  const { data: following } = useFollowing();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (org?.id === orgId) return null;
  const on = !!following?.has(orgId);

  const toggle = async () => {
    if (!org) return router.push('/login');
    setBusy(true);
    const { error } = on
      ? await supabase.from('follows').delete().eq('follower_id', org.id).eq('org_id', orgId)
      : await supabase.from('follows').insert({ org_id: orgId });
    setBusy(false);
    setError(error ? errorMessage(error) : undefined);
    if (!error) queryClient.invalidateQueries({ queryKey: ['follows'] });
  };

  return (
    <Button
      title={error ? 'Try again' : on ? 'Following' : '+ Follow'}
      variant={on ? 'secondary' : 'primary'}
      onPress={toggle}
      disabled={busy}
    />
  );
}
