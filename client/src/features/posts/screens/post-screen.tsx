import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GIVE_LABELS, POST_KIND_LABELS, type Give } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { postFacts } from '@/features/posts/components/post-card';
import { setPostStatus, setSaved, sendProposal } from '@/features/posts/mutations';
import { useIsSaved, usePost, useProposalCount, type PostDetailData } from '@/features/posts/queries';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { formatDate, formatMoney } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

/** /posts/[id] */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = usePost(id);
  return (
    <Screen title={data?.title ?? 'Post'} width="page">
      <PostDetail id={id} />
    </Screen>
  );
}

// The full post: used by its own page (signed-in and public) and by the Find two-pane detail.
export function PostDetail({ id }: { id: string }) {
  const { session, org } = useSession();
  const { data: p, isPending, isError } = usePost(id);

  // Counts as a view for the owner's insights (not for the owner or visitors).
  useEffect(() => {
    if (p && org && org.id !== p.owner_id) supabase.rpc('record_post_view', { post: p.id });
  }, [p, org]);

  if (isPending) return <Loading />;
  if (!p)
    return (
      <Notice
        title={isError ? "Couldn't load this post" : 'Post not found'}
        body={isError ? 'Check your connection and try again.' : 'It may have been closed or deleted.'}
        action={{ title: 'Find posts', href: '/find' }}
      />
    );

  const isOwner = session?.user.id === p.owner_id;
  const tiers = [...p.post_tiers].sort((a, b) => a.position - b.position);
  const facts = postFacts(p);

  return (
    <View style={styles.detail}>
      <Link href={`/org/${p.owner.handle}`} asChild>
        <Pressable style={styles.owner}>
          <OrgLogo name={p.owner.name} url={p.owner.logo_url} size={48} />
          <View style={styles.ownerText}>
            <ThemedText type="bodyStrong">{p.owner.name}</ThemedText>
            {p.owner.tagline && (
              <ThemedText type="small" themeColor="textSecondary">
                {p.owner.tagline}
              </ThemedText>
            )}
          </View>
        </Pressable>
      </Link>

      <View style={styles.header}>
        <ThemedText type="caption" themeColor="link">
          {POST_KIND_LABELS[p.kind].toUpperCase()}
          {p.status !== 'open' ? ` · ${p.status.toUpperCase()}` : ''}
        </ThemedText>
        <ThemedText type="title" level={1}>
          {p.title}
        </ThemedText>
        {facts.length > 0 && <ThemedText themeColor="textSecondary">{facts.join(' · ')}</ThemedText>}
      </View>

      {isOwner ? <OwnerPanel post={p} /> : <ProposalPanel post={p} />}

      {p.body ? <ThemedText>{p.body}</ThemedText> : null}

      {p.supports.length > 0 && <SupportRow label={p.kind === 'event' ? 'Needs' : 'Gives'} values={p.supports} />}

      {p.benefits ? (
        <View style={styles.section}>
          <ThemedText type="subheading">{p.kind === 'event' ? 'What sponsors get' : 'What we want in return'}</ThemedText>
          <ThemedText>{p.benefits}</ThemedText>
        </View>
      ) : null}

      {(p.starts_on || p.city || p.online) && (
        <Card>
          <ThemedText type="caption" themeColor="textSecondary">
            {p.kind === 'event' ? 'EVENT' : 'TIME WINDOW'}
          </ThemedText>
          <ThemedText type="bodyStrong">
            {[p.starts_on && formatDate(p.starts_on), p.ends_on && p.ends_on !== p.starts_on && `→ ${formatDate(p.ends_on)}`]
              .filter(Boolean)
              .join(' ') || 'Dates to be set'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {p.online ? 'Online' : p.city}
            {p.online && p.city ? ` · ${p.city}` : ''}
          </ThemedText>
        </Card>
      )}

      {tiers.length > 0 && (
        <>
          <ThemedText type="heading" level={2}>
            Tiers
          </ThemedText>
          {tiers.map((tier) => (
            <Card key={tier.id}>
              <View style={styles.tierTop}>
                <ThemedText type="subheading">{tier.name}</ThemedText>
                <ThemedText type="subheading">
                  {tier.price_cents != null ? formatMoney(tier.price_cents) : 'Ask'}
                </ThemedText>
              </View>
              {tier.benefits ? <ThemedText>{tier.benefits}</ThemedText> : null}
              {tier.slots != null && (
                <ThemedText type="small" themeColor="textSecondary">
                  {tier.slots} {tier.slots === 1 ? 'slot' : 'slots'}
                </ThemedText>
              )}
            </Card>
          ))}
        </>
      )}
    </View>
  );
}

function SupportRow({ label, values }: { label: string; values: Give[] }) {
  return (
    <ThemedText themeColor="textSecondary">
      {label}: {values.map((g) => GIVE_LABELS[g]).join(', ')}
    </ThemedText>
  );
}

function ProposalPanel({ post: p }: { post: PostDetailData }) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const me = session?.user.id;
  const [message, setMessage] = useState('');
  const [tierId, setTierId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const tiers = [...p.post_tiers].sort((a, b) => a.position - b.position);

  const { data: mine } = useQueryClientSafeProposal(p.id, me);

  if (mine)
    return (
      <Card>
        <ThemedText type="bodyStrong">You proposed on this · {mine.status.replace('_', ' ')}</ThemedText>
        {mine.thread_id && (
          <Button title="Open the conversation" variant="secondary" onPress={() => router.push(`/messages/${mine.thread_id}`)} />
        )}
      </Card>
    );
  if (p.status !== 'open') return <ThemedText themeColor="textSecondary">This post is closed to new proposals.</ThemedText>;

  const send = async () => {
    if (!me) return router.push('/login');
    if (!message.trim()) return setError('Write a short message with your proposal.');
    const cents = amount ? Math.round(Number(amount) * 100) : null;
    if (amount && !(cents != null && cents >= 0)) return setError('Amount must be a number, like 2500.');
    setBusy(true);
    setError(undefined);
    try {
      const threadId = await sendProposal(p.id, message.trim(), tierId, cents);
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['threads'] });
      router.push(`/messages/${threadId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
    setBusy(false);
  };

  return (
    <Card>
      <View style={styles.panelHead}>
        <ThemedText type="subheading">Send a proposal</ThemedText>
        {me && <SaveButton postId={p.id} />}
      </View>
      {tiers.length > 0 && (
        <ChoiceChips
          label="Tier (optional)"
          options={[{ value: '', label: 'No tier' }, ...tiers.map((t) => ({ value: t.id, label: t.name }))]}
          value={tierId ?? ''}
          onChange={(v) => setTierId(v || null)}
        />
      )}
      {me && (
        <>
          <TextField
            label="Message"
            placeholder={p.kind === 'event' ? 'Why your company fits this event' : 'Why your event fits'}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={2000}
            style={{ minHeight: 100 }}
          />
          <TextField
            label="Amount in USD (optional)"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^\d.]/g, ''))}
            keyboardType="decimal-pad"
          />
        </>
      )}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <Button title={busy ? 'Sending…' : me ? 'Send proposal' : 'Sign in to propose'} onPress={send} disabled={busy} />
    </Card>
  );
}

// The viewer's own proposal on this post, if any (RLS limits it to their own row).
function useQueryClientSafeProposal(postId: string, me: string | undefined) {
  return useQuery({
    queryKey: ['proposals', 'mine', postId, me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('status, thread_id')
        .eq('post_id', postId)
        .eq('from_id', me!)
        .maybeSingle();
      if (error) throw error;
      return data as { status: string; thread_id: string | null } | null;
    },
  });
}

export function SaveButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();
  const { org } = useSession();
  const { data: saved } = useIsSaved(postId, org?.id);
  if (!org) return null;
  const toggle = async () => {
    await setSaved(postId, !saved);
    queryClient.invalidateQueries({ queryKey: ['posts', 'saved'] });
    queryClient.invalidateQueries({ queryKey: ['posts', 'saved-state'] });
  };
  return <Button title={saved ? 'Saved ✓' : 'Save'} variant="secondary" onPress={toggle} />;
}

function OwnerPanel({ post: p }: { post: PostDetailData }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const { data: count } = useProposalCount(p.id);

  const changeStatus = async (status: 'open' | 'closed' | 'draft') => {
    try {
      await setPostStatus(p.id, status);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.ownerPanel}>
      <Button title={`View proposals (${count ?? 0})`} onPress={() => router.push('/proposals')} />
      <Button title="Edit" variant="secondary" onPress={() => router.push(`/posts/${p.id}/edit`)} />
      <Button
        title={p.status === 'open' ? 'Close to new proposals' : 'Reopen'}
        variant="secondary"
        onPress={() => changeStatus(p.status === 'open' ? 'closed' : 'open')}
      />
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  detail: { gap: Spacing.four },
  header: { gap: Spacing.one },
  owner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ownerText: { flex: 1 },
  ownerPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { gap: Spacing.one },
  tierTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
});
