import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { POST_KIND_LABELS, PROPOSAL_STATUS_LABELS, type PostKind, type ProposalStatus } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { completeProposal, leaveReview, moveProposalStatus } from '@/features/posts/mutations';
import { formatMoney, timeAgo } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// Completion goes through the dedicated button (it opens reviews and fires deal_completed).
const MOVE_OPTIONS = (['new', 'shortlisted', 'in_talks', 'won', 'declined'] as ProposalStatus[]).map((value) => ({
  value,
  label: PROPOSAL_STATUS_LABELS[value],
}));

type Box = 'received' | 'sent';
const BOXES = [
  { value: 'received', label: 'Received' },
  { value: 'sent', label: 'Sent' },
];

type Proposal = {
  id: string;
  message: string;
  amount_cents: number | null;
  status: ProposalStatus;
  created_at: string;
  thread_id: string | null;
  tier: { name: string; price_cents: number | null } | null;
  from: { handle: string; name: string };
  post: { id: string; title: string; kind: PostKind; currency: string; owner: { handle: string; name: string } };
};

export default function ProposalsScreen() {
  const { session } = useSession();
  const me = session!.user.id;
  const [box, setBox] = useState<Box>('received');

  // RLS already limits proposals to ones you sent or ones on your posts.
  const { data: proposals, isPending } = useQuery({
    queryKey: ['proposals', box, me],
    queryFn: async () => {
      const query = supabase
        .from('proposals')
        .select(
          'id, message, amount_cents, status, created_at, thread_id, tier:post_tiers!proposals_tier_id_fkey(name, price_cents), from:organizations!proposals_from_id_fkey(handle, name), post:posts!proposals_post_id_fkey(id, title, kind, currency, owner:organizations!posts_owner_id_fkey(handle, name))',
        )
        .order('created_at', { ascending: false });
      const { data, error } = box === 'received' ? await query.neq('from_id', me) : await query.eq('from_id', me);
      if (error) throw error;
      return data as unknown as Proposal[];
    },
  });

  return (
    <Screen title="Proposals">
      <ChoiceChips label="Show" options={BOXES} value={box} onChange={(v) => setBox(v as Box)} />
      {isPending ? (
        <Loading />
      ) : !proposals?.length ? (
        box === 'received' ? (
          <Notice
            title="No proposals yet"
            body="Post and proposals from interested organizers or sponsors land here."
            action={{ title: 'Post', href: '/posts/new' }}
          />
        ) : (
          <Notice
            title="You haven't proposed yet"
            body="Find a post that fits and send a proposal."
            action={{ title: 'Find posts', href: '/find' }}
          />
        )
      ) : (
        proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} received={box === 'received'} />)
      )}
    </Screen>
  );
}

function ProposalCard({ proposal, received }: { proposal: Proposal; received: boolean }) {
  const queryClient = useQueryClient();
  const { session } = useSession();
  const [error, setError] = useState<string>();
  const other = received ? proposal.from : proposal.post.owner;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  };

  const move = async (status: string) => {
    try {
      await moveProposalStatus(proposal.id, status as ProposalStatus);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
    }
  };

  const complete = async () => {
    try {
      await completeProposal(proposal.id);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
    }
  };

  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        {POST_KIND_LABELS[proposal.post.kind].toUpperCase()} · {timeAgo(proposal.created_at)}
      </ThemedText>
      <Link href={`/posts/${proposal.post.id}`}>
        <ThemedText type="subheading">{proposal.post.title}</ThemedText>
      </Link>
      <View style={styles.other}>
        <ThemedText type="small" themeColor="textSecondary">
          {received ? 'From' : 'To'}
        </ThemedText>
        <Link href={`/org/${other.handle}`}>
          <ThemedText type="smallStrong" themeColor="link">
            {other.name}
          </ThemedText>
        </Link>
      </View>
      <ThemedText>“{proposal.message}”</ThemedText>
      {(proposal.tier || proposal.amount_cents != null) && (
        <ThemedText type="smallStrong">
          {[
            proposal.tier &&
              `Tier: ${proposal.tier.name}${proposal.tier.price_cents != null ? ` (${formatMoney(proposal.tier.price_cents, proposal.post?.currency)})` : ''}`,
            proposal.amount_cents != null && `Offer: ${formatMoney(proposal.amount_cents, proposal.post?.currency)}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      )}
      {received && proposal.status !== 'completed' ? (
        <ChoiceChips label="Status" options={MOVE_OPTIONS} value={proposal.status} onChange={move} error={error} />
      ) : (
        <ThemedText type="smallStrong">Status: {PROPOSAL_STATUS_LABELS[proposal.status]}</ThemedText>
      )}
      {proposal.status === 'won' && (
        <Button title="Mark completed after the event" variant="secondary" onPress={complete} />
      )}
      {proposal.status === 'completed' && <ReviewBox proposalId={proposal.id} me={session?.user.id} />}
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      {proposal.thread_id && (
        <Button title="Open the conversation" variant="secondary" onPress={() => router.push(`/messages/${proposal.thread_id}`)} />
      )}
    </Card>
  );
}

// After completion each side rates the other 1–5 with a written review (replaces likes).
function ReviewBox({ proposalId, me }: { proposalId: string; me: string | undefined }) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number | null>(null);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['reviews', 'mine', proposalId, me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('id')
        .eq('proposal_id', proposalId)
        .eq('reviewer_id', me!)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string } | null;
    },
  });
  if (existing || done) return <ThemedText type="small" themeColor="textSecondary">Review left ✓</ThemedText>;

  const send = async () => {
    if (!rating) return setError('Pick a rating from 1 to 5.');
    try {
      await leaveReview(proposalId, rating, body.trim());
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
    }
  };

  return (
    <View style={styles.review}>
      <ThemedText type="smallStrong">Rate this deal</ThemedText>
      <ChoiceChips
        label="Rating"
        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}★` }))}
        value={rating ? String(rating) : null}
        onChange={(v) => setRating(Number(v))}
        error={error}
      />
      <TextField label="Review (optional)" value={body} onChangeText={setBody} multiline maxLength={2000} />
      <Button title="Leave review" variant="secondary" onPress={send} />
    </View>
  );
}

const styles = StyleSheet.create({
  other: { flexDirection: 'row', gap: Spacing.one, alignItems: 'center' },
  review: { gap: Spacing.two },
});
