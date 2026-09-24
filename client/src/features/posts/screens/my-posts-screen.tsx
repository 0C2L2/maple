import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { POST_KIND_LABELS } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { PostCard, type PostCardData } from '@/features/posts/components/post-card';
import { setPostStatus } from '@/features/posts/mutations';
import { useMyPosts, useProposalCount } from '@/features/posts/queries';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

/** /my-posts: your posts with status, proposal counts, edit, close. */
export default function MyPostsScreen() {
  const { org } = useSession();
  const { data: posts, isPending } = useMyPosts(org?.id);

  return (
    <Screen title="My posts">
      <Button title={org?.role === 'sponsor' ? 'Post what you sponsor' : 'Post your event'} onPress={() => router.push('/posts/new')} />
      {isPending ? (
        <Loading />
      ) : !posts?.length ? (
        <Notice title="No posts yet" body="Your posts live here, with every proposal they get." />
      ) : (
        posts.map((p) => <MyPostRow key={p.id} postId={p.id} post={p} />)
      )}
    </Screen>
  );
}

function MyPostRow({ postId, post }: { postId: string; post: PostCardData }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string>();
  const { data: count } = useProposalCount(postId);

  const changeStatus = async (status: 'open' | 'closed' | 'draft') => {
    try {
      await setPostStatus(postId, status);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <View style={styles.item}>
      <PostCard post={post} />
      <View style={styles.actions}>
        <ThemedText type="small" themeColor="textSecondary">
          {POST_KIND_LABELS[post.kind]} · {(post.status ?? 'open').toUpperCase()} · {count ?? 0}{' '}
          {(count ?? 0) === 1 ? 'proposal' : 'proposals'}
        </ThemedText>
        <View style={styles.buttons}>
          <Button title="View proposals" variant="secondary" onPress={() => router.push('/proposals')} />
          <Button title="Edit" variant="secondary" onPress={() => router.push(`/posts/${postId}/edit`)} />
          {post.status === 'open' ? (
            <Button title="Close" variant="secondary" onPress={() => changeStatus('closed')} />
          ) : post.status === 'draft' ? (
            // Drafts publish through the form, so they get its checks (like the event date).
            <Button title="Finish and publish" variant="secondary" onPress={() => router.push(`/posts/${postId}/edit`)} />
          ) : (
            <Button title="Reopen" variant="secondary" onPress={() => changeStatus('open')} />
          )}
        </View>
      </View>
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { gap: Spacing.two },
  actions: { gap: Spacing.two },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
