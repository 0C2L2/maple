import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { POST_KIND_LABELS, PROPOSAL_STATUS_LABELS, type PostKind, type ProposalStatus } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { completeProposal, leaveReview, markWon, moveProposalStatus } from '@/features/posts/mutations';
import { LAUNCH_RATE, mapleFee } from '@/lib/fees';
import { formatMoney, minorDigits, timeAgo, toMinor } from '@/lib/format';
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
  deal_cash_cents: number | null;
  deal_in_kind: string | null;
  tier: { name: string; price_cents: number | null } | null;
  from: { handle: string; name: string };
  /** For a proposal to a sponsor post: the sender's event it pitches. */
  event: { id: string; title: string; pilot: boolean } | null;
  post: {
    id: string;
    title: string;
    kind: PostKind;
    currency: string;
    pilot: boolean;
    owner: { handle: string; name: string };
  };
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
          'id, message, amount_cents, status, created_at, thread_id, deal_cash_cents, deal_in_kind, tier:post_tiers!proposals_tier_id_fkey(name, price_cents), from:organizations!proposals_from_id_fkey(handle, name), event:posts!proposals_event_post_id_fkey(id, title, pilot), post:posts!proposals_post_id_fkey(id, title, kind, currency, pilot, owner:organizations!posts_owner_id_fkey(handle, name))',
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

  // The event the deal is for, and whether I'm its organizer (the side Maple's fee comes from).
  const eventPost = proposal.post.kind === 'event' ? proposal.post : proposal.event;
  const pilot = !!eventPost?.pilot;
  const organizerSide = (proposal.post.kind === 'event') === received;
  const dealDone = proposal.status === 'won' || proposal.status === 'completed';
  const [winning, setWinning] = useState(false);

  const move = async (status: string) => {
    if (status === 'won') return setWinning(true); // Won records the deal first (DealForm).
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
      {proposal.event && (
        <View style={styles.other}>
          <ThemedText type="small" themeColor="textSecondary">
            For
          </ThemedText>
          <Link href={`/posts/${proposal.event.id}`}>
            <ThemedText type="smallStrong" themeColor="link">
              {proposal.event.title}
            </ThemedText>
          </Link>
        </View>
      )}
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
      {winning && (
        <DealForm
          proposal={proposal}
          pilot={pilot}
          onCancel={() => setWinning(false)}
          onSaved={() => {
            setWinning(false);
            refresh();
          }}
        />
      )}
      {dealDone && (proposal.deal_cash_cents != null || proposal.deal_in_kind) && (
        <View style={styles.deal}>
          <ThemedText type="smallStrong">
            Deal: {dealLine(proposal.deal_cash_cents, proposal.deal_in_kind, proposal.post.currency)}
          </ThemedText>
          {organizerSide && (
            <ThemedText type="small" themeColor="textSecondary">
              {feeNote(proposal.deal_cash_cents ?? 0, proposal.post.currency, pilot, 'your')}
            </ThemedText>
          )}
        </View>
      )}
      {proposal.status === 'won' && (
        <Button title="Mark completed after the event" variant="secondary" onPress={complete} />
      )}
      {dealDone && eventPost && (
        <Button
          title={organizerSide ? 'Write the results report' : 'See the results report'}
          variant="secondary"
          onPress={() => router.push(`/posts/${eventPost.id}`)}
        />
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

// Marking a deal Won records what was agreed: the base for Maple's fee once payments launch (D-029).
function DealForm({
  proposal,
  pilot,
  onCancel,
  onSaved,
}: {
  proposal: Proposal;
  pilot: boolean;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const currency = proposal.post.currency;
  const offered = proposal.amount_cents ?? proposal.tier?.price_cents ?? null;
  const [cash, setCash] = useState(offered != null ? String(offered / 10 ** minorDigits(currency)) : '');
  const [inKind, setInKind] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const cents = toMinor(cash, currency);

  const save = async () => {
    if (cash.trim() && cents == null) return setError('The cash amount must be a number, like 4000000.');
    if (!cents && !inKind.trim()) return setError('Add the cash amount, the in-kind items, or both.');
    setBusy(true);
    setError(undefined);
    try {
      await markWon(proposal.id, cents || null, inKind.trim() || null);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : errorMessage(e));
      setBusy(false);
    }
  };

  return (
    <View style={styles.deal}>
      <ThemedText type="bodyStrong">What did you agree?</ThemedText>
      <TextField
        label={`Cash amount in ${currency}`}
        placeholder="Leave empty if the deal is in-kind only"
        value={cash}
        onChangeText={(v) => setCash(v.replace(/[^\d.]/g, ''))}
        keyboardType="decimal-pad"
      />
      <TextField
        label="In-kind items (optional)"
        placeholder="Cloud credits, food, a venue, mentors"
        value={inKind}
        onChangeText={setInKind}
        maxLength={500}
      />
      <ThemedText type="small" themeColor="textSecondary">
        {feeNote(cents ?? 0, currency, pilot, 'the organizer’s')}
      </ThemedText>
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
      <View style={styles.actions}>
        <Button title={busy ? 'Saving…' : 'Mark as Won'} onPress={save} disabled={busy} />
        <Button title="Cancel" variant="secondary" onPress={onCancel} />
      </View>
    </View>
  );
}

const dealLine = (cash: number | null, inKind: string | null, currency: string) =>
  [cash ? `${formatMoney(cash, currency)} in cash` : null, inKind].filter(Boolean).join(' + ');

// Maple's fee on a deal once payments launch, at the launch rate. Nothing is charged during early access.
function feeNote(cash: number, currency: string, pilot: boolean, whose: 'your' | 'the organizer’s') {
  if (pilot) return 'Pilot event: no Maple fee on this deal.';
  if (!cash) return 'In-kind deals have no Maple fee.';
  const fee = mapleFee(cash, currency, LAUNCH_RATE);
  const receive = `${whose === 'your' ? 'you’d' : 'they’d'} receive ${formatMoney(cash - fee, currency)}`;
  return `When payments launch, Maple’s fee is ${formatMoney(fee, currency)} (5% launch rate), taken from ${whose} payout, so ${receive}. Nothing is charged during early access.`;
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
  deal: { gap: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
