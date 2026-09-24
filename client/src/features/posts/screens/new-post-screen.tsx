import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { POST_KINDS, type PostKind, type Region } from '@/constants/taxonomy';
import { useSession } from '@/features/auth/session';
import { emptyDraft, PostForm } from '@/features/posts/components/post-form';
import { createPost, type PostInput } from '@/features/posts/mutations';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

// Any organization posts either kind (D-028): an event it runs, or what it sponsors. The role picks the default.
export default function NewPostScreen() {
  const { org } = useSession();
  const params = useLocalSearchParams<{ kind?: string }>();
  const queryClient = useQueryClient();
  const linked = POST_KINDS.find((k) => k.value === params.kind)?.value;
  const [picked, setPicked] = useState<PostKind | undefined>(linked);
  if (!org) return <Loading />;
  const kind: PostKind = picked ?? (org.role === 'sponsor' ? 'sponsor' : 'event');
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
      <ChoiceChips
        label="What are you posting?"
        options={[
          { value: 'event', label: 'An event we run' },
          { value: 'sponsor', label: 'Events we want to sponsor' },
        ]}
        value={kind}
        onChange={(value) => setPicked(value as PostKind)}
      />
      <ThemedText themeColor="textSecondary">
        {kind === 'event'
          ? 'Sponsors browse your event and send proposals.'
          : 'Organizers with matching events send you proposals.'}
      </ThemedText>
      <PostForm
        key={kind}
        kind={kind}
        initial={emptyDraft({ categories: org.categories, regions: (org.regions ?? []) as Region[] })}
        publishTitle="Publish post"
        onSubmit={save}
      />
    </Screen>
  );
}
