import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import {
  ATTENDANCE_LABELS,
  AUDIENCE_LABELS,
  BUDGET_LABELS,
  CATEGORY_LABELS,
  GIVE_LABELS,
  ORG_KIND_LABELS,
  REGION_LABELS,
  ROLE_LABELS,
  type Region,
} from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import { useSession, type Organization } from '@/features/auth/session';
import { FollowButton } from '@/features/organizations/components/follow-button';
import { orgMeta } from '@/features/organizations/components/org-card';
import { OrgBanner, OrgLogo } from '@/features/organizations/components/org-logo';
import { useFollowerCount } from '@/features/organizations/components/org-summary-card';
import { PostCard } from '@/features/posts/components/post-card';
import { useOrgPosts } from '@/features/posts/queries';
import { ReviewCard, useReviews } from '@/features/reviews';
import { BlockButton } from '@/features/safety/components/block-button';
import { ReportLink } from '@/features/safety/components/report-link';
import { ShowcaseCard } from '@/features/showcase/components/showcase-card';
import { useIsStaff } from '@/features/safety/use-is-staff';
import { useShowcases } from '@/features/showcase/queries';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { externalUrl, formatDate } from '@/lib/format';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { TabStrip } from '@/ui/tab-strip';
import { ThemedText } from '@/ui/themed-text';

type Tab = 'posts' | 'showcase' | 'reviews' | 'about';

/** /org/[handle]: an organization's page, like an Upwork agency profile. */
export default function OrgScreen() {
  const { handle, tab } = useLocalSearchParams<{ handle: string; tab?: string }>();
  const { data: org, isPending, isError } = useQuery({
    queryKey: ['organizations', 'handle', handle],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').eq('handle', handle).maybeSingle();
      if (error) throw error;
      return data as Organization | null;
    },
  });

  if (isPending) return <Loading />;
  if (!org)
    return (
      <Screen title={isError ? 'Something went wrong' : 'Page not found'}>
        <Notice
          title={isError ? "Couldn't load this page" : 'Page not found'}
          body={isError ? 'Check your connection and try again.' : `No organization uses mapleapp.tech/org/${handle}.`}
          action={{ title: 'Find posts', href: '/find' }}
        />
      </Screen>
    );
  return <OrgPage org={org} tab={tab} />;
}

function OrgPage({ org, tab }: { org: Organization; tab?: string }) {
  const theme = useTheme();
  const wide = useIsWide();
  const { org: me } = useSession();
  const isMe = me?.id === org.id;
  const { data: followers } = useFollowerCount(org.id);
  const { data: posts } = useOrgPosts(org.id);
  const { data: reviews } = useReviews(org.id);
  const { data: showcases } = useShowcases(org.id);
  const { isStaff } = useIsStaff();

  // Public totals (deals involve private proposals, so the database counts them for everyone).
  const { data: totals } = useQuery({
    queryKey: ['organizations', org.id, 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('org_stats', { org: org.id }).single();
      if (error) throw error;
      return data as { open_posts: number; completed_deals: number; rating: number | null; reviews: number };
    },
  });
  // Suspended pages are hidden from everyone but the organization itself and Maple staff.
  if (org.suspended_at && !isMe && !isStaff)
    return (
      <Screen title="Page not available">
        <Notice title="This page isn't available" body="This organization is suspended." action={{ title: 'Find posts', href: '/find' }} />
      </Screen>
    );
  const active = totals?.open_posts ?? 0;
  const deals = totals?.completed_deals ?? 0;

  const tabs = [
    { value: 'posts' as const, label: `Posts (${posts?.length ?? 0})` },
    { value: 'showcase' as const, label: `Showcase (${showcases?.length ?? 0})` },
    { value: 'reviews' as const, label: `Reviews (${totals?.reviews ?? 0})` },
    { value: 'about' as const, label: 'About' },
  ];
  const current: Tab = tabs.find((t) => t.value === tab)?.value ?? 'posts';
  const show = (next: Tab) => router.setParams({ tab: next });

  const stats = [
    `${active} open ${active === 1 ? 'post' : 'posts'}`,
    `${deals} ${deals === 1 ? 'deal' : 'deals'} completed`,
    totals?.reviews ? `${totals.rating}★ (${totals.reviews})` : null,
    `${followers ?? 0} ${followers === 1 ? 'follower' : 'followers'}`,
    `On Maple since ${formatDate(org.created_at.slice(0, 10))}`,
  ].filter(Boolean);

  return (
    <Screen title={org.name} width="page">
      <Card style={styles.header}>
        <OrgBanner url={org.banner_url} height={wide ? 180 : 110} />
        <View style={styles.headerBody}>
          <View style={[styles.logo, { borderColor: theme.background }]}>
            <OrgLogo name={org.name} url={org.logo_url} size={wide ? 104 : 80} />
          </View>
          <ThemedText type="title" level={1}>
            {org.name}
          </ThemedText>
          {org.tagline && <ThemedText type="lead">{org.tagline}</ThemedText>}
          <ThemedText type="small" themeColor="textSecondary">
            {[orgMeta(org), ...stats].filter(Boolean).join(' · ')}
          </ThemedText>
          {org.suspended_at && (
            <ThemedText type="smallStrong" themeColor="danger">
              Suspended by Maple staff{org.suspended_reason ? `: ${org.suspended_reason}` : ''}
            </ThemedText>
          )}
          <View style={styles.actions}>
            {isMe ? (
              <>
                <Button title="Edit page" onPress={() => router.push('/settings')} />
                <Button title="Post" variant="secondary" onPress={() => router.push('/posts/new')} />
              </>
            ) : (
              <>
                <FollowButton orgId={org.id} />
                <MessageButton orgId={org.id} />
                {org.website && (
                  <Button title="Visit website" variant="secondary" onPress={() => Linking.openURL(externalUrl(org.website!) as string)} />
                )}
                <BlockButton orgId={org.id} />
              </>
            )}
          </View>
          {!isMe && <ReportLink type="organization" id={org.id} />}
        </View>
        <TabStrip tabs={tabs} value={current} onChange={show} />
      </Card>

      {current === 'posts' &&
        (posts?.length ? (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <Notice title="No posts yet" action={isMe ? { title: 'Post', href: '/posts/new' } : undefined} />
        ))}

      {current === 'showcase' &&
        (showcases?.length ? (
          <View style={styles.showcases}>
            {showcases.map((s) => (
              <ShowcaseCard key={s.id} showcase={s} />
            ))}
          </View>
        ) : (
          <Notice title="No showcases yet" body="Past events appear here with photos and results." />
        ))}

      {current === 'reviews' &&
        (reviews?.length ? (
          reviews.map((review) => <ReviewCard key={review.id} review={review} />)
        ) : (
          <Notice title="No reviews yet" body="Reviews appear here after completed deals." />
        ))}

      {current === 'about' && <AboutTab org={org} />}
    </Screen>
  );
}

function AboutTab({ org }: { org: Organization }) {
  const rows: [string, string | null | undefined][] = [
    ['Website', org.website],
    ['Type', `${ROLE_LABELS[org.role]} · ${ORG_KIND_LABELS[org.kind]}`],
    ['City', org.location],
    ['Event types', org.categories.map((c) => CATEGORY_LABELS[c]).join(', ')],
    ['Regions', org.regions.map((r) => REGION_LABELS[r as Region] ?? r).join(', ')],
    ['Typical attendance', org.attendance_band && ATTENDANCE_LABELS[org.attendance_band]],
    ['Audience', org.audience_types.map((a) => AUDIENCE_LABELS[a]).join(', ')],
    ['Budget per event', org.budget_band && BUDGET_LABELS[org.budget_band]],
    ['Gives', org.gives.map((g) => GIVE_LABELS[g]).join(', ')],
  ];
  return (
    <Section title="Overview">
      {org.about ? <ThemedText>{org.about}</ThemedText> : null}
      {rows
        .filter(([, value]) => value)
        .map(([label, value]) => (
          <View key={label} style={styles.aboutRow}>
            <ThemedText type="smallStrong">{label}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {value}
            </ThemedText>
          </View>
        ))}
    </Section>
  );
}

function MessageButton({ orgId }: { orgId: string }) {
  const { org } = useSession();
  const [error, setError] = useState<string>();
  const message = async () => {
    if (!org) return router.push('/login');
    const { data, error } = await supabase.rpc('start_conversation', { other: orgId });
    if (error) return setError(errorMessage(error));
    router.push(`/messages/${data}`);
  };
  return <Button title={error ? 'Try again' : 'Message'} variant="secondary" onPress={message} />;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={styles.section}>
      <ThemedText type="heading" level={2}>
        {title}
      </ThemedText>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { padding: 0, gap: 0, overflow: 'hidden' },
  headerBody: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, gap: Spacing.one },
  logo: { marginTop: -52, alignSelf: 'flex-start', borderWidth: 4, borderRadius: 20, marginBottom: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  section: { gap: Spacing.three, padding: Spacing.four },
  aboutRow: { gap: Spacing.half },
  showcases: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
