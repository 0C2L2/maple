import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { CONTACT_EMAIL } from '@/constants/site';

import { BUDGET_BANDS, CATEGORIES, POST_KINDS, REGIONS, type Category } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { PostCard, type PostCardData } from '@/features/posts/components/post-card';
import { useFollowingPosts, usePostSearch, useSavedPosts } from '@/features/posts/queries';
import { useIsWide } from '@/hooks/use-is-wide';
import { track } from '@/lib/analytics';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { Loading } from '@/ui/loading';
import { MultiChips } from '@/ui/multi-chips';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TabStrip } from '@/ui/tab-strip';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type ListTab = 'matches' | 'recent' | 'following' | 'saved';
const SIGNED_IN_TABS = [
  { value: 'matches' as const, label: 'Best matches' },
  { value: 'recent' as const, label: 'Most recent' },
  { value: 'following' as const, label: 'Following' },
  { value: 'saved' as const, label: 'Saved' },
];

/**
 * /find: browse posts, laid out like Upwork's job search: filters on the left, search and results on the
 * right (phones stack them). Public: signed-out visitors browse the most recent posts.
 */
export default function FindScreen() {
  const wide = useIsWide();
  const { org } = useSession();
  const params = useLocalSearchParams<{ q?: string; kind?: string; category?: string }>();
  const q = params.q ?? ''; // the URL holds the query, so the top bar's search box works here too
  // Signed-in organizations start with the other side's posts, ranked by fit with their own page.
  // Website links can pick the side (?kind=event|sponsor) and an event type (?category=hackathon).
  const linkedKind = POST_KINDS.find((k) => k.value === params.kind)?.value;
  const linkedCategory = CATEGORIES.find((c) => c.value === params.category)?.value;
  const [tab, setTab] = useState<ListTab>(org ? 'matches' : 'recent');
  const [kind, setKind] = useState<string>(linkedKind ?? (org ? (org.role === 'organizer' ? 'sponsor' : 'event') : ''));
  const [categories, setCategories] = useState<Category[]>(linkedCategory ? [linkedCategory] : []);
  // The same screen stays mounted when a header link changes the params, so follow them (adjusting state while
  // rendering, https://react.dev/learn/you-might-not-need-an-effect).
  const [linked, setLinked] = useState({ kind: linkedKind, category: linkedCategory });
  if (linked.kind !== linkedKind || linked.category !== linkedCategory) {
    setLinked({ kind: linkedKind, category: linkedCategory });
    if (linkedKind) setKind(linkedKind);
    if (linkedCategory) setCategories([linkedCategory]);
  }
  const [region, setRegion] = useState('');
  const [budget, setBudget] = useState('');
  const [sort, setSort] = useState('recent');

  const isSearch = tab === 'matches' || tab === 'recent';
  const search = usePostSearch(q, {
    kind,
    categories,
    region,
    budget_band: budget,
    ...(tab === 'matches' && org ? { match: org.id } : {}),
    ...(tab === 'recent' ? { sort } : {}),
  });
  const following = useFollowingPosts(tab === 'following' ? org?.id : undefined);
  const saved = useSavedPosts(tab === 'saved' ? org?.id : undefined);
  const rows = search.data?.pages.flat() ?? [];
  const filtered = !!(categories.length || region || budget);

  const filters = (
    <Card>
      <ThemedText type="subheading" level={2}>
        Filters
      </ThemedText>
      <ChoiceChips label="Type" options={[{ value: '', label: 'All posts' }, ...POST_KINDS]} value={kind} onChange={setKind} />
      {tab === 'recent' && (
        <ChoiceChips
          label="Sort"
          options={[
            { value: 'recent', label: 'Newest' },
            { value: 'deadline', label: 'Deadline soon' },
            { value: 'fewest', label: 'Fewest proposals' },
          ]}
          value={sort}
          onChange={setSort}
        />
      )}
      <MultiChips label="Event types" options={CATEGORIES} value={categories} onChange={setCategories} />
      <ChoiceChips label="Region" options={[{ value: '', label: 'Anywhere' }, ...REGIONS]} value={region} onChange={setRegion} />
      <ChoiceChips
        label={kind === 'event' ? 'Sponsorship goal' : kind === 'sponsor' ? 'Budget per event' : 'Budget'}
        options={[{ value: '', label: 'Any' }, ...BUDGET_BANDS]}
        value={budget}
        onChange={setBudget}
      />
      {filtered && (
        <Button
          title="Clear filters"
          variant="secondary"
          onPress={() => {
            setCategories([]);
            setRegion('');
            setBudget('');
          }}
        />
      )}
    </Card>
  );

  const results = isSearch ? (
    search.isPending ? (
      <Loading />
    ) : search.isError ? (
      <Notice title="Couldn't load posts" body="Check your connection and try again." />
    ) : !rows.length ? (
      <NoResults signedIn={!!org} />
    ) : (
      <>
        {rows.map((post, position) => (
          <PostCard
            key={post.id}
            post={post}
            onPress={() => track('search_result_clicked', { tab, position, has_query: !!q })}
          />
        ))}
        {search.hasNextPage && (
          <Button
            title={search.isFetchingNextPage ? 'Loading…' : 'More posts'}
            variant="secondary"
            onPress={() => search.fetchNextPage()}
            disabled={search.isFetchingNextPage}
          />
        )}
      </>
    )
  ) : (
    <PostList
      loading={tab === 'following' ? following.isPending : saved.isPending}
      posts={tab === 'following' ? following.data : saved.data}
      emptyTitle={tab === 'following' ? 'No posts from organizations you follow' : 'Nothing saved yet'}
      emptyBody={
        tab === 'following'
          ? 'Follow organizations from their pages to see their new posts here.'
          : 'Tap Save on a post to keep it here.'
      }
    />
  );

  const main = (
    // flex only in the side-by-side layout; in a stacked column it would collapse inside the ScrollView.
    <View style={wide ? styles.main : styles.stack}>
      <SearchBox key={q} initial={q} onSubmit={(text) => router.setParams({ q: text || undefined })} />
      {org && (
        <Card style={styles.tabs}>
          <TabStrip tabs={SIGNED_IN_TABS} value={tab} onChange={setTab} />
        </Card>
      )}
      {!wide && isSearch && filters}
      {results}
      {!org && <Button title="Join to post and send proposals" onPress={() => router.push('/signup')} />}
    </View>
  );

  return (
    <Screen title="Find" width={wide ? 'wide' : 'reading'}>
      {wide ? (
        <View style={styles.columns}>
          <View style={styles.side}>{isSearch ? filters : <FollowingNote tab={tab} />}</View>
          {main}
        </View>
      ) : (
        main
      )}
    </Screen>
  );
}

// Labeled examples (not real posts) so an empty search still shows what Maple looks like, plus a way forward.
const EXAMPLES: PostCardData[] = [
  {
    id: 'example-event',
    kind: 'event',
    title: 'Example: a 300-person student hackathon looking for sponsors',
    categories: ['hackathon'],
    regions: ['online'],
    budget_band: '5k_25k',
    attendance_band: '100_500',
    deadline: null,
  },
  {
    id: 'example-sponsor',
    kind: 'sponsor',
    title: 'Example: a developer-tools company backing meetups with credits and swag',
    categories: ['meetup'],
    regions: ['online'],
    budget_band: '1k_5k',
    attendance_band: null,
    deadline: null,
  },
];

function NoResults({ signedIn }: { signedIn: boolean }) {
  return (
    <Card>
      <ThemedText type="subheading">No posts match yet</ThemedText>
      <ThemedText themeColor="textSecondary">
        Try fewer filters, or post your own and let the other side find you. This is what posts look like:
      </ThemedText>
      {EXAMPLES.map((p) => (
        <View key={p.id} aria-hidden style={styles.example}>
          <PostCard post={p} onSelect={() => {}} />
        </View>
      ))}
      <View style={styles.exampleActions}>
        <Button title={signedIn ? 'Post' : 'Join to post'} onPress={() => router.push(signedIn ? '/posts/new' : '/signup')} />
        <Button
          title="Tell us what you need"
          variant="secondary"
          onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Introduce me')}`)}
        />
      </View>
    </Card>
  );
}

function SearchBox({ initial, onSubmit }: { initial: string; onSubmit: (text: string) => void }) {
  const [text, setText] = useState(initial);
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInput}>
        <TextField
          label="Search posts"
          placeholder="Hackathon in Boston, cloud credits, student meetups…"
          value={text}
          onChangeText={setText}
          onSubmitEditing={() => onSubmit(text.trim())}
          returnKeyType="search"
        />
      </View>
      <Button title="Search" onPress={() => onSubmit(text.trim())} />
    </View>
  );
}

function FollowingNote({ tab }: { tab: ListTab }) {
  return (
    <Card>
      <ThemedText themeColor="textSecondary">
        {tab === 'following'
          ? 'Open posts from the organizations you follow, newest first.'
          : 'Posts you saved, newest first.'}
      </ThemedText>
    </Card>
  );
}

function PostList({
  loading,
  posts,
  emptyTitle,
  emptyBody,
}: {
  loading: boolean;
  posts: PostCardData[] | undefined;
  emptyTitle: string;
  emptyBody: string;
}) {
  if (loading) return <Loading />;
  if (!posts?.length) return <Notice title={emptyTitle} body={emptyBody} />;
  return (
    <>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.four },
  side: { width: 300 },
  main: { flex: 1, minWidth: 0, gap: Spacing.three },
  stack: { gap: Spacing.three },
  tabs: { padding: 0, gap: 0, overflow: 'hidden' },
  searchRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  searchInput: { flex: 1 },
  example: { opacity: 0.7 },
  exampleActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
