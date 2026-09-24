import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import type { Region } from '@/constants/taxonomy';
import { useSession } from '@/features/auth/session';
import { emptyDraft, PostForm } from '@/features/posts/components/post-form';
import { createPost, type PostInput } from '@/features/posts/mutations';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

// Organizers post event posts (the event plan lives inside); sponsors post sponsor posts.
export default function NewPostScreen() {
  const { org } = useSession();
  const queryClient = useQueryClient();
  if (!org) return <Loading />;
  const kind = org.role === 'sponsor' ? 'sponsor' : 'event';
  const heading = kind === 'event' ? 'Post your event' : 'Post what you sponsor';

  const save = async (input: PostInput) => {
    const id = await createPost(input);
    queryClient.invalidateQueries();
    router.replace(`/posts/${id}`);
  };

  return (
    <Screen title={heading} width="form">
      <ThemedText type="title" level={1}>
        {heading}
      </ThemedText>
      <ThemedText themeColor="textSecondary">
        {kind === 'event'
          ? 'The other side browses your event and sends proposals.'
          : 'Organizers with matching events send you proposals.'}
      </ThemedText>
      <PostForm
        kind={kind}
        initial={emptyDraft({ categories: org.categories, regions: (org.regions ?? []) as Region[] })}
        publishTitle="Publish post"
        onSubmit={save}
      />
    </Screen>
  );
}
