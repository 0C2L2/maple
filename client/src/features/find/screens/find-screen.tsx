import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';

import { BUDGET_BANDS, CATEGORIES, POST_KINDS, REGIONS } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { PostCard, type PostCardData } from '@/features/posts/components/post-card';
import { useFollowingPosts, usePostSearch, useSavedPosts } from '@/features/posts/queries';
import { Button } from '@/ui/button';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { MultiChips } from '@/ui/multi-chips';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';

type ListTab = 'matches' | 'recent' | 'following' | 'saved';
const LIST_TABS = [
  { value: 'matches', label: 'Best matches' },
  { value: 'recent', label: 'Most recent' },
  { value: 'following', label: 'Following' },
  { value: 'saved', label: 'Saved' },
];

/** /find: browse posts (and, later, organizations). Public; signed-out visitors can browse. */
export default function FindScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const { org } = useSession();
  const [q, setQ] = useState(params.q ?? '');
  const [submitted, setSubmitted] = useState(params.q ?? '');
  const [kind, setKind] = useState('');
  const [tab, setTab] = useState<ListTab>('matches');
  const [categories, setCategories] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [budget, setBudget] = useState('');

  const filters = {
    ...(kind ? { kind } : {}),
    ...(categories.length === 1 ? { category: categories[0] } : {}),
    ...(region ? { region } : {}),
    ...(budget ? { budget_band: budget } : {}),
  };
  const search = usePostSearch(submitted, filters);
  const following = useFollowingPosts(tab === 'following' ? org?.id : undefined);
  const saved = useSavedPosts(tab === 'saved' ? org?.id : undefined);

  const rows = search.data?.pages.flat() ?? [];

  return (
    <Screen title="Find">
      <TextField
        label="Search posts"
        placeholder="Hackathon in Boston, $5K sponsor…"
        value={q}
        onChangeText={setQ}
        onSubmitEditing={() => setSubmitted(q.trim())}
        returnKeyType="search"
      />
      <ChoiceChips
        label="Show"
        options={LIST_TABS}
        value={tab}
        onChange={(v) => setTab(v as ListTab)}
      />
      {(tab === 'matches' || tab === 'recent') && (
        <>
          <ChoiceChips
            label="Type"
            options={[{ value: '', label: 'All' }, ...POST_KINDS]}
            value={kind}
            onChange={setKind}
          />
          <MultiChips label="Event types" options={CATEGORIES} value={categories} onChange={setCategories} />
          <ChoiceChips
            label="Region"
            options={[{ value: '', label: 'Anywhere' }, ...REGIONS]}
            value={region}
            onChange={setRegion}
          />
          <ChoiceChips
            label="Budget"
            options={[{ value: '', label: 'Any' }, ...BUDGET_BANDS]}
            value={budget}
            onChange={setBudget}
          />
        </>
      )}

      {tab === 'following' && (
        <PostList loading={following.isPending} posts={following.data} signedIn={!!org} />
      )}
      {tab === 'saved' && (
        <PostList loading={saved.isPending} posts={saved.data} signedIn={!!org} emptyTitle="Nothing saved yet" />
      )}

      {(tab === 'matches' || tab === 'recent') && (
        <>
          {search.isPending ? (
            <Loading />
          ) : search.isError ? (
            <Notice title="Couldn't load posts" body="Check your connection and try again." />
          ) : !rows.length ? (
            <Notice
              title="No posts match"
              body="Try fewer filters, or post your own and let the other side find you."
              action={{ title: org ? 'Post' : 'Join to post', href: org ? '/posts/new' : '/login' }}
            />
          ) : (
            <FlatList
              data={tab === 'recent' ? [...rows].sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? '')) : rows}
              keyExtractor={(p) => p.id}
              scrollEnabled={false}
              renderItem={({ item }) => <PostCard post={item} />}
              contentContainerStyle={styles.list}
              onEndReached={() => search.fetchNextPage()}
              ListFooterComponent={search.isFetchingNextPage ? <ActivityIndicator /> : null}
            />
          )}
          {!org && (
            <Button title="Join to post and propose" variant="secondary" onPress={() => router.push('/login')} />
          )}
        </>
      )}
    </Screen>
  );
}

function PostList({
  loading,
  posts,
  signedIn,
  emptyTitle = 'Nothing here yet',
}: {
  loading: boolean;
  posts: PostCardData[] | undefined;
  signedIn: boolean;
  emptyTitle?: string;
}) {
  if (!signedIn) return <Notice title="Sign in to see this tab" action={{ title: 'Sign in', href: '/login' }} />;
  if (loading) return <Loading />;
  if (!posts?.length)
    return <Notice title={emptyTitle} body="Follow organizations to fill the Following tab, or save posts you like." />;
  return (
    <View style={styles.list}>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
});
