import { useQuery, useQueryClient } from '@tanstack/react-query';
import { type Href } from 'expo-router';
import { useEffect } from 'react';

import { timeAgo } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Card } from '@/ui/card';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

type Notification = { id: string; link: string; body: string; read_at: string | null; created_at: string };

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const { data: items, isPending } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, link, body, read_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Opening this page marks everything read; the list keeps showing which ones were new.
  useEffect(() => {
    if (!items?.some((n) => !n.read_at)) return;
    supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .then(() => queryClient.invalidateQueries({ queryKey: ['notifications', 'unread'] }));
  }, [items, queryClient]);

  if (isPending) return <Loading />;
  return (
    <Screen title="Notifications">
      {!items?.length ? (
        <Notice title="Nothing yet" body="Pitches, messages, follows, and comments show up here." />
      ) : (
        items.map((n) => (
          <Card key={n.id} href={n.link as Href}>
            <ThemedText type={n.read_at ? 'default' : 'bodyStrong'}>{n.body}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {n.read_at ? '' : 'NEW · '}
              {timeAgo(n.created_at)}
            </ThemedText>
          </Card>
        ))
      )}
    </Screen>
  );
}
