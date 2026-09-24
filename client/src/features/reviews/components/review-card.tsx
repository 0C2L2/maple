import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { timeAgo } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

export type Review = {
  id: string;
  rating: number;
  body: string;
  created_at: string;
  post: { id: string; title: string } | null;
  reviewer: { handle: string; name: string; logo_url: string | null };
};

/** Reviews of an organization, newest first. Public. */
export function useReviews(orgId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', 'of', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select(
          'id, rating, body, created_at, post:posts!reviews_post_id_fkey(id, title), reviewer:organizations!reviews_reviewer_id_fkey(handle, name, logo_url)',
        )
        .eq('reviewee_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as Review[];
    },
  });
}

/** Average rating + count, for the organization header. */
export function useRatingSummary(orgId: string | undefined) {
  const { data: reviews } = useReviews(orgId);
  if (!reviews?.length) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

// One post-event review: stars, body, who left it, and on which post.
export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <View style={styles.row}>
        <OrgLogo name={review.reviewer.name} url={review.reviewer.logo_url} size={40} />
        <View style={styles.text}>
          <Link href={`/org/${review.reviewer.handle}`}>
            <ThemedText type="bodyStrong">{review.reviewer.name}</ThemedText>
          </Link>
          <ThemedText type="caption" themeColor="textSecondary">
            {'★'.repeat(review.rating)}
            {'☆'.repeat(5 - review.rating)} · {timeAgo(review.created_at)}
          </ThemedText>
        </View>
      </View>
      {review.body ? <ThemedText>{review.body}</ThemedText> : null}
      {review.post && (
        <Link href={`/posts/${review.post.id}`}>
          <ThemedText type="small" themeColor="link">
            On: {review.post.title}
          </ThemedText>
        </Link>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  text: { flex: 1 },
});
