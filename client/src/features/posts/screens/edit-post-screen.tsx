import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';

import { draftFromInput, PostForm } from '@/features/posts/components/post-form';
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

  if (isPending) return <Loading />;
  if (!post)
    return (
      <Screen title="Edit post">
        <Notice title="Post not found" action={{ title: 'My posts', href: '/my-posts' }} />
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
        initial={draftFromInput({
          kind: post.kind,
          title: post.title,
          body: post.body,
          categories: post.categories,
          regions: post.regions,
          budget_band: post.budget_band,
          attendance_band: post.attendance_band,
          audience_types: post.audience_types,
          supports: post.supports,
          benefits: post.benefits,
          starts_on: post.starts_on ?? null,
          ends_on: post.ends_on ?? null,
          city: post.city ?? null,
          online: post.online ?? false,
          deadline: post.deadline,
          status: post.status === 'draft' ? 'draft' : 'open',
          tiers: post.post_tiers.map((t) => ({ name: t.name, price_cents: t.price_cents, benefits: t.benefits, slots: t.slots })),
        })}
        publishTitle={post.status === 'draft' ? 'Publish post' : 'Save changes'}
        onSubmit={save}
      />
    </Screen>
  );
}
