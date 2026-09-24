import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import type { AudienceType, Give, PostStatus } from '@/constants/taxonomy';
import { POST_CARD_COLUMNS, type PostCardData } from '@/features/posts/components/post-card';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase';

export type Tier = {
  id: string;
  position: number;
  name: string;
  price_cents: number | null;
  benefits: string;
  slots: number | null;
};

export type PostDetailData = PostCardData & {
  status: PostStatus;
  body: string;
  benefits: string;
  supports: Give[];
  audience_types: AudienceType[];
  ends_on: string | null;
  owner: { handle: string; name: string; tagline: string | null; logo_url: string | null };
  post_tiers: Tier[];
};

export type PostResult = PostCardData & { owner_id: string; owner_handle: string; score?: number };

const PAGE_SIZE = 20; // matches search_posts

/** Drops empty filters; the database treats a missing key as "any". */
export const cleanFilters = (filters: Record<string, string>) =>
  Object.fromEntries(Object.entries(filters).filter(([, value]) => value));

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(
          '*, owner:organizations!posts_owner_id_fkey(handle, name, tagline, logo_url), post_tiers(*)',
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PostDetailData | null;
    },
  });
}

/** How many proposals a post has (for the owner panel and my-posts). */
export function useProposalCount(postId: string | undefined) {
  return useQuery({
    queryKey: ['proposals', 'count', postId],
    enabled: !!postId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

// Open posts matching a keyword query and filters, 20 at a time.
export function usePostSearch(q: string, filters: Record<string, string>, source: 'find' | 'landing' = 'find') {
  const clean = cleanFilters(filters);
  return useInfiniteQuery({
    queryKey: ['search', 'posts', q, clean],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase.rpc('search_posts', { q, filters: clean, page: pageParam });
      if (error) throw error;
      if (pageParam === 0)
        track('search_performed', { tab: 'posts', source, has_query: !!q, filters: Object.keys(clean) });
      return data as PostResult[];
    },
    getNextPageParam: (last, all) => (last.length === PAGE_SIZE ? all.length : undefined),
  });
}

/** The signed-in organization's own posts, newest first. */
export function useMyPosts(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'mine', ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_CARD_COLUMNS)
        .eq('owner_id', ownerId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as PostCardData[];
    },
  });
}

/** An organization's open posts, for its page. */
export function useOrgPosts(orgId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'org', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_CARD_COLUMNS)
        .eq('owner_id', orgId!)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as PostCardData[];
    },
  });
}

/** Posts from organizations the viewer follows (the Following tab). */
export function useFollowingPosts(orgId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'following', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: follows, error: followError } = await supabase.from('follows').select('org_id').eq('follower_id', orgId!);
      if (followError) throw followError;
      const ids = (follows as { org_id: string }[]).map((f) => f.org_id);
      if (!ids.length) return [] as PostCardData[];
      const { data, error } = await supabase
        .from('posts')
        .select(`${POST_CARD_COLUMNS}, owner:organizations!posts_owner_id_fkey(name, handle, logo_url)`)
        .in('owner_id', ids)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(40);
      if (error) throw error;
      return (data as unknown as (PostCardData & { owner: { name: string; handle: string; logo_url: string | null } | null })[]).map(
        (p) => ({ ...p, owner_name: p.owner?.name, owner_handle: p.owner?.handle, owner_logo_url: p.owner?.logo_url }),
      );
    },
  });
}

/** Posts the viewer bookmarked (the Saved tab). */
export function useSavedPosts(orgId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'saved', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_posts')
        .select(`post:posts!saved_posts_post_id_fkey(${POST_CARD_COLUMNS})`)
        .eq('owner_id', orgId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data as unknown as { post: PostCardData }[]).map((r) => r.post);
    },
  });
}

/** Whether the viewer saved a post. */
export function useIsSaved(postId: string | undefined, orgId: string | undefined) {
  return useQuery({
    queryKey: ['posts', 'saved-state', postId, orgId],
    enabled: !!postId && !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('owner_id', orgId!)
        .eq('post_id', postId!)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });
}
