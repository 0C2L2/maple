import type { AttendanceBand, AudienceType, BudgetBand, Category, Give, PostKind, ProposalStatus } from '@/constants/taxonomy';
import { track } from '@/lib/analytics';
import { errorMessage, supabase } from '@/lib/supabase';

export type TierInput = { name: string; price_cents: number | null; benefits: string; slots: number | null };

export type PostInput = {
  kind: PostKind;
  title: string;
  body: string;
  categories: Category[];
  regions: string[];
  budget_band: BudgetBand | null;
  attendance_band: AttendanceBand | null;
  audience_types: AudienceType[];
  supports: Give[];
  benefits: string;
  starts_on: string | null;
  ends_on: string | null;
  city: string | null;
  online: boolean;
  deadline: string | null;
  status: 'draft' | 'open';
  tiers: TierInput[];
};

/** Creates a post with its tiers. Returns the post id. */
export async function createPost(input: PostInput): Promise<string> {
  const { tiers, ...post } = input;
  const { data, error } = await supabase.from('posts').insert(post).select('id').single();
  if (error) throw new Error(errorMessage(error));
  // ponytail: two inserts, not one transaction; an RPC can wrap them if partial saves show up.
  if (tiers.length) {
    const { error: tierError } = await supabase
      .from('post_tiers')
      .insert(tiers.map((tier, position) => ({ ...tier, post_id: data.id, position })));
    if (tierError) throw new Error(`Saved, but the tiers failed: ${errorMessage(tierError)}`);
  }
  track('post_created', { kind: input.kind, status: input.status, tiers: tiers.length });
  return data.id as string;
}

/** Updates a post's fields and replaces its tiers. */
export async function updatePostWithTiers(id: string, input: PostInput): Promise<void> {
  const { tiers, kind: _kind, ...patch } = input;
  const { error } = await supabase.from('posts').update(patch).eq('id', id);
  if (error) throw new Error(errorMessage(error));
  const { error: deleteError } = await supabase.from('post_tiers').delete().eq('post_id', id);
  if (deleteError) throw new Error(errorMessage(deleteError));
  if (tiers.length) {
    const { error: tierError } = await supabase
      .from('post_tiers')
      .insert(tiers.map((tier, position) => ({ ...tier, post_id: id, position })));
    if (tierError) throw new Error(`Saved, but the tiers failed: ${errorMessage(tierError)}`);
  }
}

/** Opens or closes a post to new proposals. */
export async function setPostStatus(id: string, status: 'open' | 'closed' | 'draft'): Promise<void> {
  const { error } = await supabase.from('posts').update({ status }).eq('id', id);
  if (error) throw new Error(errorMessage(error));
}

/** Applies to a post. Returns the new conversation's thread id. */
export async function sendProposal(
  postId: string,
  message: string,
  tierId: string | null,
  amountCents: number | null,
): Promise<string> {
  const { data, error } = await supabase.rpc('send_proposal', {
    post: postId,
    message,
    tier_id: tierId,
    amount_cents: amountCents,
  });
  if (error) throw new Error(error.code === '23505' ? 'You already proposed on this post.' : errorMessage(error));
  track('proposal_sent', { with_tier: !!tierId, with_amount: amountCents != null });
  return data as string;
}

/** The post owner moves a proposal through new → shortlisted → in talks → won / declined. */
export async function moveProposalStatus(id: string, status: ProposalStatus): Promise<void> {
  const { error } = await supabase.from('proposals').update({ status }).eq('id', id);
  if (error) throw new Error(errorMessage(error));
  track('proposal_status_changed', { status });
}

/** Either side of a won deal marks it completed after the event. Reviews open then. */
export async function completeProposal(id: string): Promise<void> {
  const { error } = await supabase.rpc('complete_proposal', { proposal: id });
  if (error) throw new Error(errorMessage(error));
  track('proposal_status_changed', { status: 'completed' });
  track('deal_completed', { proposal_id: id });
}

/** Rates the other side 1–5 with a written review, once per side per completed deal. */
export async function leaveReview(proposalId: string, rating: number, body: string): Promise<void> {
  const { error } = await supabase.rpc('leave_review', { proposal: proposalId, rating, body: body || '' });
  if (error) throw new Error(errorMessage(error));
  track('review_left', { rating });
}

/** Bookmarks or unbookmarks a post. */
export async function setSaved(postId: string, saved: boolean): Promise<void> {
  const { error } = saved
    ? await supabase.from('saved_posts').insert({ post_id: postId })
    : await supabase.from('saved_posts').delete().eq('post_id', postId);
  if (error) throw new Error(errorMessage(error));
}
