import { Link, Redirect, router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { CATEGORIES, type Role } from '@/constants/taxonomy';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { PostCard } from '@/features/posts/components/post-card';
import { usePostSearch } from '@/features/posts/queries';
import { SiteFooter } from '@/features/site/components/site-footer';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

const DESCRIPTION =
  'Maple is the sponsorship marketplace: event organizers post their event, sponsors post what they back, and each side sends proposals. Deals close with public reviews.';

const WHO = [
  { role: 'organizer' as Role, title: 'Event organizers looking for sponsors', body: 'Event companies, communities, university clubs, and nonprofits.' },
  { role: 'sponsor' as Role, title: 'Companies that sponsor events', body: 'Brands and startups that want to reach the right audience.' },
  { role: 'sponsor' as Role, title: 'Agencies that place sponsorships', body: 'Find events for every client from one organization page.' },
];

const FAQ = [
  {
    q: 'Is Maple for individuals?',
    a: 'No. Every Maple account is an organization: the event organizer or the sponsoring company. The person who signs in stays private.',
  },
  { q: 'Is Maple free?', a: 'Yes. Creating a page, posting, searching, proposing, and messaging are free.' },
  {
    q: 'How do deals work?',
    a: 'Organizers post their event, sponsors post what they back. The other side sends a proposal, the owner compares applicants, and after the event both sides leave a public review.',
  },
  { q: 'Is there an app?', a: 'Maple works in your browser today. iPhone and Android apps are coming soon.' },
];

export default function HomeScreen() {
  // The iOS/Android app opens straight into the product; the landing page is website-only.
  if (process.env.EXPO_OS !== 'web') return <Redirect href="/find" />;
  return <Landing />;
}

// The signed-out home page: hero with search, latest posts, categories, how it works, who it's for, FAQ.
function Landing() {
  const theme = useTheme();
  const wide = useIsWide();
  const { session } = useSession();
  const [q, setQ] = useState('');
  const join = (role: Role) =>
    session ? router.push('/find') : router.push({ pathname: '/login', params: { role } });
  const search = () => router.push({ pathname: '/find', params: q.trim() ? { q: q.trim() } : {} });

  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <PageMeta title="Maple" description={DESCRIPTION} path="/" />

      <Section>
        <View style={[styles.hero, wide && styles.heroWide]}>
          <View style={[styles.heroText, wide && styles.heroColumn]}>
            <ThemedText type="display" level={1} style={{ color: theme.link }}>
              Find your next sponsor — or the event worth backing
            </ThemedText>
            <ThemedText type="lead" themeColor="textSecondary">
              Organizers post their event. Sponsors post what they back. Proposals, messages, and reviews close the
              deal — no cold emails.
            </ThemedText>
            <TextInput
              accessibilityLabel="Search posts"
              placeholder="Try “hackathon in Boston”…"
              placeholderTextColor={theme.textSecondary}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={search}
              returnKeyType="search"
              style={[styles.heroSearch, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            />
            <View style={styles.heroButtons}>
              <Button title="Post your event" onPress={() => join('organizer')} />
              <Button title="Post as a sponsor" variant="secondary" onPress={() => join('sponsor')} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              By joining or signing in, you agree to Maple&apos;s{' '}
              <Link href="/legal/privacy" style={{ color: theme.link }}>
                privacy notice
              </Link>
              .
            </ThemedText>
          </View>
          <View style={wide && styles.heroColumn}>
            <PreviewCards />
          </View>
        </View>
      </Section>

      <Section tinted title="Latest posts">
        <LatestPosts />
      </Section>

      <Section title="Explore sponsorship by event type">
        <View style={styles.pills}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.value} onPress={search} style={[styles.pill, { borderColor: theme.textSecondary }]}>
              <ThemedText type="bodyStrong">{c.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section tinted title="How it works">
        <View style={styles.split}>
          <Feature
            title="Organizers: post your event"
            body="Dates, place, audience, what you need, and what sponsors get — with priced tiers. Compare proposals and pick."
            action="Post your event"
            onPress={() => join('organizer')}
          />
          <Feature
            title="Sponsors: post what you back"
            body="Budget, event types, and what you give. Organizers with matching events propose to you."
            action="Post as a sponsor"
            onPress={() => join('sponsor')}
          />
          <Feature
            title="Both sides: review after the event"
            body="Won proposals become completed deals, then each side rates the other. Reviews build trust for the next deal."
            action="Find posts"
            onPress={search}
          />
        </View>
      </Section>

      <Section title="Who is Maple for?">
        <ThemedText type="lead" themeColor="textSecondary">
          Organizations on both sides of event sponsorship. Individuals don&apos;t sign up; each account is an
          organization.
        </ThemedText>
        <View style={styles.who}>
          {WHO.map((item) => (
            <Pressable
              key={item.title}
              onPress={() => join(item.role)}
              style={[styles.whoRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <View style={styles.whoText}>
                <ThemedText type="subheading">{item.title}</ThemedText>
                <ThemedText themeColor="textSecondary">{item.body}</ThemedText>
              </View>
              <ThemedText type="subheading" themeColor="link">
                →
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section tinted title="Questions">
        <View style={styles.faq}>
          {FAQ.map((item) => (
            <View key={item.q} style={styles.faqItem}>
              <ThemedText type="subheading" level={3}>
                {item.q}
              </ThemedText>
              <ThemedText themeColor="textSecondary">{item.a}</ThemedText>
            </View>
          ))}
        </View>
      </Section>

      <Section>
        <View style={styles.final}>
          <ThemedText type="title" level={2} style={styles.center}>
            Join the organizations finding sponsors and events on Maple
          </ThemedText>
          <View style={styles.heroButtons}>
            <Button title="Get started" onPress={() => join('organizer')} />
          </View>
        </View>
      </Section>

      <SiteFooter />
    </ScrollView>
  );
}

function LatestPosts() {
  const { data, isPending } = usePostSearch('', {});
  if (isPending) return null;
  const posts = data?.pages.flat().slice(0, 4) ?? [];
  if (!posts.length) return null;
  return (
    <View style={styles.latest}>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} />
      ))}
    </View>
  );
}

// A static preview of the product (an event post and a sponsor post), in place of a stock illustration.
function PreviewCards() {
  return (
    <View style={styles.preview}>
      <Card>
        <View style={styles.previewRow}>
          <OrgLogo name="HackCity Boston" url={null} size={48} />
          <View style={styles.previewText}>
            <ThemedText type="caption" themeColor="link">
              EVENT POST
            </ThemedText>
            <ThemedText type="subheading">Sponsor HackCity Boston 2026</ThemedText>
            <ThemedText type="small">HackCity Boston · Nov 14, 2026</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Hackathon · Boston · 100–500 attendees · 12 proposals
            </ThemedText>
          </View>
        </View>
      </Card>
      <Card>
        <View style={styles.previewRow}>
          <OrgLogo name="Acme Cloud" url={null} size={48} />
          <View style={styles.previewText}>
            <ThemedText type="caption" themeColor="link">
              SPONSOR POST
            </ThemedText>
            <ThemedText type="subheading">Backing 5 student hackathons this spring</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Acme Cloud · Budget $1–5K · Cash, credits, mentors
            </ThemedText>
          </View>
        </View>
      </Card>
    </View>
  );
}

function Feature({ title, body, action, onPress }: { title: string; body: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.feature}>
      <ThemedText type="title" level={2}>
        {title}
      </ThemedText>
      <ThemedText type="lead" themeColor="textSecondary">
        {body}
      </ThemedText>
      <View style={styles.featureAction}>
        <Button title={action} variant="secondary" onPress={onPress} />
      </View>
    </View>
  );
}

function Section({ children, title, tinted }: { children: ReactNode; title?: string; tinted?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, tinted && { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.sectionInner}>
        {title && (
          <ThemedText type="title" level={2}>
            {title}
          </ThemedText>
        )}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.six },
  sectionInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.four },
  hero: { gap: Spacing.five },
  heroWide: { flexDirection: 'row', alignItems: 'center' },
  heroText: { gap: Spacing.four, maxWidth: 560 },
  // Only in the side-by-side layout; flex in a stacked column would collapse it inside the ScrollView.
  heroColumn: { flex: 1 },
  heroSearch: { height: 48, borderRadius: 10, paddingHorizontal: Spacing.four, fontSize: 16, maxWidth: 480 },
  heroButtons: { gap: Spacing.three, maxWidth: 400, width: '100%' },
  preview: { gap: Spacing.three },
  previewRow: { flexDirection: 'row', gap: Spacing.three },
  previewText: { flex: 1, gap: Spacing.half },
  latest: { gap: Spacing.three },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  who: { gap: Spacing.three },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.four,
  },
  whoText: { flex: 1, gap: Spacing.one },
  split: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.six },
  feature: { flexGrow: 1, flexBasis: 280, gap: Spacing.three },
  featureAction: { alignSelf: 'flex-start' },
  faq: { maxWidth: 760, gap: Spacing.four },
  faqItem: { gap: Spacing.one },
  final: { alignItems: 'center', gap: Spacing.four },
  center: { textAlign: 'center', maxWidth: 760 },
});
