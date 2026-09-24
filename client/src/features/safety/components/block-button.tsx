import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useSession } from '@/features/auth/session';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';

// Block or unblock an organization. A block stops messages and proposals both ways (enforced in the database).
export function BlockButton({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const { org } = useSession();
  const [failed, setFailed] = useState(false);
  const { data: blocked } = useQuery({
    queryKey: ['blocks', org?.id, orgId],
    enabled: !!org,
    queryFn: async () => {
      // RLS returns only the signed-in organization's own blocks.
      const { data, error } = await supabase.from('blocks').select('blocked_id').eq('blocked_id', orgId).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
  if (!org || org.id === orgId) return null;

  const toggle = async () => {
    const { error } = blocked
      ? await supabase.from('blocks').delete().eq('blocked_id', orgId)
      : await supabase.from('blocks').insert({ blocked_id: orgId });
    setFailed(!!error);
    queryClient.invalidateQueries({ queryKey: ['blocks'] });
  };
  return <Button title={failed ? 'Try again' : blocked ? 'Unblock' : 'Block'} variant="secondary" onPress={toggle} />;
}
