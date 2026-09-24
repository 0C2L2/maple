import { useQuery } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { THREAD_LIST_KEY, ThreadView } from '@/features/messages/screens/thread-screen';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Card } from '@/ui/card';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

type Member = { org: { id: string; handle: string; name: string; logo_url: string | null } };
type Row = {
  last_read_at: string;
  thread: {
    id: string;
    last_message_at: string;
    post: { title: string } | null;
    thread_participants: Member[];
  };
};

// Messaging, like LinkedIn's: conversations on the left, the open one on the right (desktop).
// On phones the list opens each conversation on its own screen.
export default function ThreadsScreen() {
  const wide = useIsWide();
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { session } = useSession();
  const me = session!.user.id;
  const { thread: selected } = useLocalSearchParams<{ thread?: string }>();

  const { data: rows, isPending, isError } = useQuery({
    queryKey: THREAD_LIST_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('thread_participants')
        .select(
          'last_read_at, thread:threads!thread_participants_thread_id_fkey(id, last_message_at, post:posts!threads_post_id_fkey(title), thread_participants(org:organizations!thread_participants_org_id_fkey(id, handle, name, logo_url)))',
        )
        .eq('org_id', me);
      if (error) throw error;
      // ponytail: sorted here, not in SQL; fine for hundreds of conversations per organization.
      return (data as unknown as Row[]).sort((a, b) => b.thread.last_message_at.localeCompare(a.thread.last_message_at));
    },
  });

  if (isPending) return <Loading />;
  if (!rows?.length)
    return (
      <Screen title="Messaging">
        <Notice
          title={isError ? "Couldn't load your messages" : 'No conversations yet'}
            body={
              isError
                ? 'Check your connection and try again.'
                : 'Send a proposal or message an organization from its page to start one.'
            }
            action={{ title: 'Find posts', href: '/find' }}
        />
      </Screen>
    );

  if (!wide)
    return (
      <Screen title="Messaging">
        <Card style={styles.flat}>
          {rows.map((row) => (
            <ThreadRow key={row.thread.id} row={row} me={me} />
          ))}
        </Card>
      </Screen>
    );

  const current = selected ?? rows[0].thread.id;
  return (
    <Screen title="Messaging" width="wide">
      <Card style={[styles.panes, { height: Math.max(460, height - 140) }]}>
        <ScrollView style={[styles.listPane, { borderRightColor: theme.border }]}>
          {rows.map((row) => (
            <ThreadRow
              key={row.thread.id}
              row={row}
              me={me}
              selected={row.thread.id === current}
              onSelect={() => router.setParams({ thread: row.thread.id })}
            />
          ))}
        </ScrollView>
        <View style={styles.threadPane}>
          <ThreadView key={current} threadId={current} />
        </View>
      </Card>
    </Screen>
  );
}

function ThreadRow({ row, me, selected, onSelect }: { row: Row; me: string; selected?: boolean; onSelect?: () => void }) {
  const theme = useTheme();
  const { thread, last_read_at } = row;
  const others = thread.thread_participants.map((m) => m.org).filter((o) => o.id !== me);
  const names = others.map((o) => o.name).join(', ') || 'Just you';
  const unread = thread.last_message_at > last_read_at;
  const body = (
    <Pressable
      role={onSelect ? 'button' : undefined}
      onPress={onSelect}
      aria-pressed={onSelect ? selected : undefined}
      // Flat object: on phones this Pressable is a Link child, and Link's Slot can't merge style arrays.
      style={StyleSheet.flatten([
        styles.row,
        { borderBottomColor: theme.border },
        selected && { backgroundColor: theme.backgroundSelected, borderLeftColor: theme.brand },
      ])}>
      <OrgLogo name={names} url={others[0]?.logo_url} size={44} />
      <View style={styles.rowText}>
        <ThemedText type={unread ? 'bodyStrong' : 'default'} numberOfLines={1}>
          {names}
        </ThemedText>
        {thread.post && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {thread.post.title}
          </ThemedText>
        )}
      </View>
      <View style={styles.rowMeta}>
        <ThemedText type="caption" themeColor="textSecondary">
          {timeAgo(thread.last_message_at)}
        </ThemedText>
        {unread && <View accessibilityLabel="Unread" style={[styles.dot, { backgroundColor: theme.brand }]} />}
      </View>
    </Pressable>
  );
  if (onSelect) return body;
  return (
    <Link href={`/messages/${thread.id}`} asChild>
      {body}
    </Link>
  );
}

const styles = StyleSheet.create({
  flat: { padding: 0, gap: 0, overflow: 'hidden' },
  panes: { flexDirection: 'row', padding: 0, gap: 0, overflow: 'hidden' },
  listPane: { width: 340, flexGrow: 0, borderRightWidth: 1 },
  threadPane: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  rowText: { flex: 1 },
  rowMeta: { alignItems: 'flex-end', gap: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
