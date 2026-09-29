import { useQuery } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { type ProposalStatus } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { ProposalBadge, THREAD_LIST_KEY, ThreadView } from '@/features/messages/screens/thread-screen';
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
    post: { title: string; cover_url: string | null } | null;
    proposals: { status: ProposalStatus }[];
    messages: { body: string; author_id: string }[]; // only the latest one
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
          'last_read_at, thread:threads!thread_participants_thread_id_fkey(id, last_message_at, post:posts!threads_post_id_fkey(title, cover_url), proposals!proposals_thread_id_fkey(status), messages(body, author_id), thread_participants(org:organizations!thread_participants_org_id_fkey(id, handle, name, logo_url)))',
        )
        .eq('org_id', me)
        .order('created_at', { referencedTable: 'thread.messages', ascending: false })
        .limit(1, { referencedTable: 'thread.messages' });
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
  const last = thread.messages[0];
  const status = thread.proposals[0]?.status;
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
      {/* The post leads (it is what tells two chats with the same organization apart); their logo sits on its corner. */}
      {thread.post ? (
        <View>
          <OrgLogo name={thread.post.title} url={thread.post.cover_url} size={48} />
          <View style={[styles.corner, { borderColor: theme.background }]}>
            <OrgLogo name={names} url={others[0]?.logo_url} size={22} />
          </View>
        </View>
      ) : (
        <OrgLogo name={names} url={others[0]?.logo_url} size={48} />
      )}
      <View style={styles.rowText}>
        <View style={styles.titleLine}>
          {status && <ProposalBadge status={status} />}
          <ThemedText type="bodyStrong" numberOfLines={1} style={styles.rowText}>
            {thread.post?.title ?? names}
          </ThemedText>
        </View>
        {last && (
          <ThemedText type="small" themeColor={unread ? 'text' : 'textSecondary'} numberOfLines={1}>
            {last.author_id === me ? 'You' : names}: {last.body}
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
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  corner: { position: 'absolute', right: -6, bottom: -6, borderWidth: 2, borderRadius: 7 },
  rowMeta: { alignItems: 'flex-end', gap: Spacing.one },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
