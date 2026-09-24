import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ReadingWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { timeAgo } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

type Member = { org: { id: string; handle: string; name: string; logo_url: string | null } };
type Thread = { id: string; post: { id: string; title: string } | null; thread_participants: Member[] };
type Message = { id: string; body: string; created_at: string; author_id: string };

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
          'id, post:posts!threads_post_id_fkey(id, title), thread_participants(org:organizations!thread_participants_org_id_fkey(id, handle, name, logo_url))',
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
              <View style={styles.headText}>
                <ThemedText type="bodyStrong">{title}</ThemedText>
                {thread.post && (
                  <Link href={`/posts/${thread.post.id}`}>
                    <ThemedText type="small" themeColor="link" numberOfLines={1}>
                      About: {thread.post.title}
                    </ThemedText>
                  </Link>
                )}
              </View>
            </Pressable>
          </Link>
        )}
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
        <View style={styles.column}>
          {messages?.length === 0 && <ThemedText themeColor="textSecondary">No messages yet. Say hello.</ThemedText>}
          {messages?.map((m) => {
            const mine = m.author_id === me;
            return (
              <View
                key={m.id}
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: theme.brand }
                    : { alignSelf: 'flex-start', backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText style={{ color: mine ? theme.onBrand : theme.text }}>{m.body}</ThemedText>
                <ThemedText type="caption" style={{ color: mine ? theme.onBrand : theme.textSecondary, opacity: 0.85 }}>
                  {timeAgo(m.created_at)}
                </ThemedText>
              </View>
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

const styles = StyleSheet.create({
  fill: { flex: 1 },
  head: { borderBottomWidth: 1, padding: Spacing.three },
  headOrg: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headText: { flex: 1 },
  list: { padding: Spacing.three, flexGrow: 1 },
  column: { width: '100%', maxWidth: ReadingWidth, alignSelf: 'center', gap: Spacing.two },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.half },
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
