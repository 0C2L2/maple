import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { useSession } from '@/features/auth/session';
import { draftFromInput, inputFromPost, PostForm } from '@/features/posts/components/post-form';
import { updatePostWithTiers, type PostInput } from '@/features/posts/mutations';
import { usePost } from '@/features/posts/queries';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

/** /posts/[id]/edit: the owner edits their post. */
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: post, isPending } = usePost(id);
  const { org } = useSession();

  if (isPending) return <Loading />;
  if (!post || post.owner_id !== org?.id)
    return (
      <Screen title="Edit post">
        <Notice
          title={post ? 'You can only edit your own posts' : 'Post not found'}
          action={{ title: 'My posts', href: '/my-posts' }}
        />
      </Screen>
    );

  const save = async (input: PostInput) => {
    await updatePostWithTiers(id, input);
    queryClient.invalidateQueries({ queryKey: ['posts'] });
    router.replace(`/posts/${id}`);
  };

  return (
    <Screen title="Edit post" width="form">
      <ThemedText type="title" level={1}>
        Edit post
      </ThemedText>
      <PostForm
        kind={post.kind}
        initial={draftFromInput(inputFromPost(post))}
        status={post.status}
        publishTitle={post.status === 'draft' ? 'Publish post' : 'Save changes'}
        onSubmit={save}
      />
    </Screen>
  );
}
