import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { Fragment, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PROPOSAL_STATUS_LABELS, type ProposalStatus } from '@/constants/taxonomy';
import { ReadingWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

type Member = { org: { id: string; handle: string; name: string; logo_url: string | null } };
type Offer = {
  from_id: string;
  status: ProposalStatus;
  amount_cents: number | null;
  tier: { name: string; price_cents: number | null } | null;
};
type Thread = {
  id: string;
  post: { id: string; title: string; cover_url: string | null; currency: string } | null;
  proposals: Offer[];
  thread_participants: Member[];
};
type Message = { id: string; body: string; created_at: string; author_id: string };

const dayFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

export const THREAD_LIST_KEY = ['threads', 'list'];

/** /messages/[threadId]: one conversation on its own screen (phones, or a shared link). */
export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  return <ThreadView threadId={threadId} standalone />;
}

// One conversation: header, live messages, and the composer. The desktop Messaging tab shows it in its right pane.
export function ThreadView({ threadId, standalone }: { threadId: string; standalone?: boolean }) {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { session } = useSession();
  const me = session!.user.id;
  const scroll = useRef<ScrollView>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();
  const messagesKey = ['threads', threadId, 'messages'];

  const { data: thread, isPending } = useQuery({
    queryKey: ['threads', threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('threads')
        .select(
          'id, post:posts!threads_post_id_fkey(id, title, cover_url, currency), proposals!proposals_thread_id_fkey(from_id, status, amount_cents, tier:post_tiers!proposals_tier_id_fkey(name, price_cents)), thread_participants(org:organizations!thread_participants_org_id_fkey(id, handle, name, logo_url))',
        )
        .eq('id', threadId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Thread | null;
    },
  });

  // ponytail: loads the latest 500 messages; add "load older" when conversations get that long.
  const { data: messages } = useQuery({
    queryKey: messagesKey,
    enabled: !!thread,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, created_at, author_id')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data as Message[]).reverse();
    },
  });

  // New messages arrive live through Supabase Realtime. The topic is unique per screen: supabase.channel() hands
  // back an existing channel with the same topic (this thread can be open twice in the stack), and adding a
  // callback to an already-subscribed channel throws.
  useEffect(() => {
    const channel = supabase
      .channel(`thread:${threadId}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        () => queryClient.invalidateQueries({ queryKey: ['threads', threadId, 'messages'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, queryClient]);

  // Seeing the messages marks the conversation read.
  useEffect(() => {
    if (!messages) return;
    supabase
      .from('thread_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .eq('org_id', me)
      .then(() => queryClient.invalidateQueries({ queryKey: THREAD_LIST_KEY }));
  }, [messages, threadId, me, queryClient]);

  // A block (either way) turns messaging off; the database refuses new messages, so say why up front.
  const otherId = thread?.thread_participants.find((m) => m.org.id !== me)?.org.id;
  const { data: blocked } = useQuery({
    queryKey: ['blocks', 'with', otherId],
    enabled: !!otherId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('blocked_with', { other: otherId });
      if (error) throw error;
      return data as boolean;
    },
  });

  if (isPending) return <Loading />;
  if (!thread) return <Notice title="Conversation not found" action={{ title: 'All messages', href: '/messages' }} />;

  const others = thread.thread_participants.map((m) => m.org).filter((o) => o.id !== me);
  const title = others.map((o) => o.name).join(', ') || 'Conversation';
  const orgs = new Map(thread.thread_participants.map((m) => [m.org.id, m.org]));
  // Each proposal opens its own thread, so a post thread has at most one.
  const offer = thread.proposals[0];
  const price = offer?.amount_cents ?? offer?.tier?.price_cents;
  const offerLine =
    offer &&
    [
      offer.from_id === me ? 'Your proposal' : 'Their proposal',
      offer.tier?.name,
      price != null && thread.post && formatMoney(price, thread.post.currency),
    ]
      .filter(Boolean)
      .join(' · ');

  const send = async () => {
    const text = body.trim();
    if (!text) return;
    // The first reply to someone else's message makes this a matched conversation (the north-star event).
    const matches = !!messages?.some((m) => m.author_id !== me) && !messages?.some((m) => m.author_id === me);
    setBody('');
    setError(undefined);
    const { error } = await supabase.from('messages').insert({ thread_id: threadId, body: text });
    if (error) {
      setBody(text);
      return setError(errorMessage(error));
    }
    track('message_sent');
    if (matches) track('matched_conversation', { thread_id: threadId });
    queryClient.invalidateQueries({ queryKey: messagesKey });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.background }]}
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={process.env.EXPO_OS === 'ios' ? 100 : 0}>
      {standalone && <Stack.Screen options={{ title }} />}
      {standalone && <PageMeta title={title} />}
      <View style={[styles.head, { borderBottomColor: theme.border }]}>
        {others[0] && (
          <Link href={`/org/${others[0].handle}`} asChild>
            <Pressable style={styles.headOrg}>
              <OrgLogo name={others[0].name} url={others[0].logo_url} size={40} />
              <ThemedText type="bodyStrong" numberOfLines={1} style={styles.headText}>
                {title}
              </ThemedText>
            </Pressable>
          </Link>
        )}
      </View>
      {/* Daangn-style item bar: the post this conversation is about, and what was proposed. */}
      {thread.post && (
        <Link href={`/posts/${thread.post.id}`} asChild>
          <Pressable style={StyleSheet.flatten([styles.head, styles.headOrg, { borderBottomColor: theme.border }])}>
            <OrgLogo name={thread.post.title} url={thread.post.cover_url} size={48} />
            <View style={styles.headText}>
              <View style={styles.itemTitle}>
                {offer && <ProposalBadge status={offer.status} />}
                <ThemedText type="smallStrong" numberOfLines={1} style={styles.headText}>
                  {thread.post.title}
                </ThemedText>
              </View>
              {offerLine && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {offerLine}
                </ThemedText>
              )}
            </View>
          </Pressable>
        </Link>
      )}
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <View style={styles.column}>
          {messages?.length === 0 && <ThemedText themeColor="textSecondary">No messages yet. Say hello.</ThemedText>}
          {messages?.map((m, i) => {
            const mine = m.author_id === me;
            const prev = messages[i - 1];
            const day = dayFormat.format(new Date(m.created_at));
            const newDay = !prev || dayFormat.format(new Date(prev.created_at)) !== day;
            const author = orgs.get(m.author_id);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.day}>
                    {day}
                  </ThemedText>
                )}
                <View style={[styles.row, mine && styles.rowMine]}>
                  {!mine &&
                    (newDay || prev.author_id !== m.author_id ? (
                      <OrgLogo name={author?.name ?? ''} url={author?.logo_url} size={32} />
                    ) : (
                      <View style={styles.avatarGap} />
                    ))}
                  <View style={[styles.bubble, { backgroundColor: mine ? theme.brand : theme.backgroundElement }]}>
                    <ThemedText style={{ color: mine ? theme.onBrand : theme.text }}>{m.body}</ThemedText>
                  </View>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {timeFormat.format(new Date(m.created_at))}
                  </ThemedText>
                </View>
              </Fragment>
            );
          })}
        </View>
      </ScrollView>
      {blocked ? (
        <View style={[styles.composer, { borderTopColor: theme.border }]}>
          <ThemedText themeColor="textSecondary" style={styles.column}>
            Messaging is off: one of you blocked the other.
          </ThemedText>
        </View>
      ) : (
      <View style={[styles.composer, { borderTopColor: theme.border }]}>
        <View style={[styles.column, styles.composerRow]}>
          <TextInput
            accessibilityLabel="Message"
            placeholder="Write a message"
            placeholderTextColor={theme.textSecondary}
            value={body}
            onChangeText={setBody}
            onSubmitEditing={send}
            submitBehavior="submit"
            multiline
            maxLength={4000}
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />
          <Button title="Send" onPress={send} />
        </View>
        {error && (
          <ThemedText role="alert" themeColor="danger" style={styles.column}>
            {error}
          </ThemedText>
        )}
      </View>
      )}
    </KeyboardAvoidingView>
  );
}

export function ProposalBadge({ status }: { status: ProposalStatus }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: theme.brandSoft }]}>
      <ThemedText type="caption" style={{ color: theme.link }}>
        {PROPOSAL_STATUS_LABELS[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { borderBottomWidth: 1, padding: Spacing.three },
  headOrg: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headText: { flex: 1 },
  itemTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  badge: { borderRadius: 4, paddingHorizontal: Spacing.one, paddingVertical: Spacing.half },
  list: { padding: Spacing.three, flexGrow: 1 },
  column: { width: '100%', maxWidth: ReadingWidth, alignSelf: 'center', gap: Spacing.two },
  day: { alignSelf: 'center', marginVertical: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  rowMine: { flexDirection: 'row-reverse' },
  avatarGap: { width: 32 },
  bubble: { maxWidth: '75%', flexShrink: 1, borderRadius: 18, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  composer: { borderTopWidth: 1, padding: Spacing.two },
  composerRow: { flexDirection: 'row', alignItems: 'flex-end' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 140,
  },
});
