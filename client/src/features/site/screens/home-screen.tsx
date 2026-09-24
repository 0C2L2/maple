import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, Redirect, router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { CATEGORY_LABELS, type Category } from '@/constants/taxonomy';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { PostCard } from '@/features/posts/components/post-card';
import { usePostSearch } from '@/features/posts/queries';
import { ShowcaseCard } from '@/features/showcase/components/showcase-card';
import { useShowcases } from '@/features/showcase/queries';
import { SiteFooter } from '@/features/site/components/site-footer';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Carousel } from '@/ui/carousel';
import { motion } from '@/ui/motion';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

const DESCRIPTION =
  'Maple is the sponsorship marketplace: event organizers post their event, sponsors post what they back, and each side sends proposals. Deals close with public reviews.';

// Photos: assets/images/site/CREDITS.md.
const PHOTOS = {
  hero: require('@/assets/images/site/hero.webp'),
  sponsor: require('@/assets/images/site/sponsor.webp'),
  cta: require('@/assets/images/site/cta.webp'),
};

const STEPS = [
  {
    title: 'Post',
    body: 'Organizers post their event: plan, audience, and what sponsors get. Sponsors post what they back. Free.',
    image: require('@/assets/images/site/plan.webp'),
    alt: 'Planning an event at a laptop',
  },
  {
    title: 'Compare proposals',
    body: 'The other side sends proposals with a tier and an amount. Shortlist, talk in private messages, and pick.',
    image: require('@/assets/images/site/talk.webp'),
    alt: 'A team talking over a laptop',
  },
  {
    title: 'Close and review',
    body: 'Mark the deal Won, run the event, then both sides leave a review that builds trust for the next deal.',
    image: require('@/assets/images/site/event.webp'),
    alt: 'A crowd in front of a lit stage',
  },
];

const TRUST: { title: string; body: string; icon: SymbolViewProps['name'] }[] = [
  {
    title: 'Organizations only',
    body: 'Every account is an organization page with its own address and history.',
    icon: { ios: 'building.2', android: 'apartment', web: 'apartment' },
  },
  {
    title: 'Reviews from real deals',
    body: 'Only the two sides of a completed deal review each other, after the event.',
    icon: { ios: 'checkmark.seal', android: 'verified', web: 'verified' },
  },
  {
    title: 'Report and block',
    body: 'Report anything that breaks the rules, or block an organization in one tap.',
    icon: { ios: 'flag', android: 'flag', web: 'flag' },
  },
];

// Event types: the two biggest get photo tiles, the rest get icon tiles (one cell per type).
const PHOTO_TYPES: { category: Category; image: number; alt: string }[] = [
  { category: 'hackathon', image: require('@/assets/images/site/hackathon.webp'), alt: 'People coding on laptops at a hackathon' },
  { category: 'conference', image: require('@/assets/images/site/conference.webp'), alt: 'A full conference audience' },
];
const ICON_TYPES: { category: Category; icon: SymbolViewProps['name'] }[] = [
  { category: 'meetup', icon: { ios: 'person.3', android: 'groups', web: 'groups' } },
  { category: 'workshop', icon: { ios: 'hammer', android: 'construction', web: 'construction' } },
  { category: 'festival', icon: { ios: 'party.popper', android: 'celebration', web: 'celebration' } },
  { category: 'other', icon: { ios: 'square.grid.2x2', android: 'category', web: 'category' } },
];

const FAQ = [
  {
    q: 'Is Maple free?',
    a: 'Yes, during early access. Posting, messaging, and reviews stay free. The pricing page has the details.',
  },
  {
    q: 'Can one organization both run events and sponsor others?',
    a: 'Yes. Post an event you run, and post the events you want to sponsor, from the same organization page.',
  },
  {
    q: 'Does Maple handle payments?',
    a: 'Not yet. Organizations agree the payment directly. Our trust and safety page has tips for doing that safely.',
  },
  {
    q: 'Is Maple for individuals?',
    a: 'No. Every account is an organization: an event organizer or a sponsoring company. The person who signs in stays private.',
  },
  { q: 'Is there an app?', a: 'Maple works in your browser today. The Android app comes first, then iPhone.' },
];

export default function HomeScreen() {
  const { session, isLoading } = useSession();
  // The iOS/Android app opens straight into the product (or sign-in); the landing page is website-only.
  if (process.env.EXPO_OS !== 'web') return isLoading ? null : <Redirect href={session ? '/find' : '/login'} />;
  return <Landing />;
}

// The website home, in Wishket's order: hero, organizations, event types, featured posts, showcase, trust,
// how it works, questions, and a closing call to action, with a bar that follows once you scroll.
// Motion (src/global.css): the hero rises in on load, sections rise in as they scroll into view, and
// nothing moves for visitors who ask for reduced motion.
function Landing() {
  const theme = useTheme();
  const [showBar, setShowBar] = useState(false);
  return (
    <View style={[styles.fill, { backgroundColor: theme.background }]}>
      <ScrollView onScroll={(e) => setShowBar(e.nativeEvent.contentOffset.y > 640)} scrollEventThrottle={100}>
        <PageMeta title="Maple" description={DESCRIPTION} path="/" />
        <Hero />
        <Organizations />
        <EventTypes />
        <FeaturedPosts />
        <Showcases />
        <WhyMaple />
        <Section tinted>
          <Steps />
        </Section>
        <Section>
          <Faq />
        </Section>
        <Section>
          <FinalCta />
        </Section>
        <SiteFooter />
      </ScrollView>
      {showBar && <StickyBar />}
    </View>
  );
}

function Hero() {
  const theme = useTheme();
  const wide = useIsWide(960);
  const [q, setQ] = useState('');
  const latest = usePostSearch('', { sort: 'recent' }, 'landing').data?.pages.flat()[0];
  const search = () => router.push({ pathname: '/find', params: q.trim() ? { q: q.trim() } : {} });

  return (
    <View {...motion({ glow: '' })} style={styles.heroBand}>
      <View style={[styles.sectionInner, styles.hero, wide && styles.row]}>
        <View style={[styles.heroText, wide && styles.heroTextWide]}>
          <View {...motion({ enter: 0 })}>
            <ThemedText type="caption" themeColor="link">
              THE SPONSORSHIP MARKETPLACE FOR ORGANIZATIONS
            </ThemedText>
          </View>
          <View {...motion({ enter: 1 })}>
            <ThemedText level={1} style={[styles.heroTitle, wide && styles.heroTitleWide]}>
              Post your event once. <Text style={{ color: theme.link }}>Sponsors send you proposals.</Text>
            </ThemedText>
          </View>
          <View {...motion({ enter: 2 })}>
            <ThemedText type="lead" themeColor="textSecondary" style={styles.measure}>
              Organizers post their event, sponsors post what they back, and the other side sends proposals.
            </ThemedText>
          </View>
          <View {...motion({ enter: 3 })} style={styles.heroActions}>
            <View style={styles.buttons}>
              <Button title="Post your event free" onPress={() => router.push('/posts/new')} />
              <Button title="Find sponsors" variant="secondary" onPress={() => router.push('/sponsors')} />
            </View>
            <TextInput
              accessibilityLabel="Search posts"
              placeholder="Search events and sponsors, like “hackathon in Seoul”"
              placeholderTextColor={theme.textSecondary}
              value={q}
              onChangeText={setQ}
              onSubmitEditing={search}
              returnKeyType="search"
              style={[styles.heroSearch, { backgroundColor: theme.backgroundElement, borderColor: theme.border, color: theme.text }]}
            />
          </View>
        </View>
        <View {...motion({ enter: 4 })} style={[styles.heroArt, wide && styles.heroArtWide]}>
          <Image
            source={PHOTOS.hero}
            accessibilityLabel="A speaker on stage in front of a full audience"
            style={[styles.heroPhoto, wide && styles.heroPhotoWide]}
            contentFit="cover"
            priority="high"
          />
          {latest && (
            <View style={[styles.heroCard, wide && styles.heroCardWide]}>
              <PostCard post={latest} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Real organization logos only. The wall appears once there are enough of them to read as a wall.
function Organizations() {
  const { data } = useQuery({
    queryKey: ['organizations', 'logos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('handle, name, logo_url')
        .not('logo_url', 'is', null)
        .order('created_at')
        .limit(12);
      if (error) throw error;
      return data as { handle: string; name: string; logo_url: string }[];
    },
  });
  if (!data || data.length < 4) return null;
  return (
    <Section>
      <ThemedText type="smallStrong" themeColor="textSecondary" style={styles.center}>
        Organizations on Maple
      </ThemedText>
      <View style={styles.logos}>
        {data.map((org) => (
          <Link key={org.handle} href={`/org/${org.handle}`} aria-label={org.name}>
            <OrgLogo name={org.name} url={org.logo_url} size={52} />
          </Link>
        ))}
      </View>
    </Section>
  );
}

function EventTypes() {
  const theme = useTheme();
  const wide = useIsWide(760);
  const { data: counts } = useQuery({
    queryKey: ['posts', 'category-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('category_counts');
      if (error) throw error;
      return Object.fromEntries((data as { category: Category; posts: number }[]).map((r) => [r.category, r.posts]));
    },
  });
  const open = (category: Category) => router.push({ pathname: '/find', params: { category } });
  const count = (c: Category) => {
    const n = counts?.[c];
    return n ? `${n} open ${n === 1 ? 'post' : 'posts'}` : 'Browse posts';
  };

  return (
    <Section title="Sponsorship by event type">
      <View style={[styles.bento, wide && styles.row]}>
        {PHOTO_TYPES.map((t, i) => (
          <Pressable
            key={t.category}
            {...motion({ lift: '' })}
            role="link"
            onPress={() => open(t.category)}
            style={[styles.photoTile, wide && { flex: i === 0 ? 1.4 : 1, height: 280 }]}>
            <Image source={t.image} accessibilityLabel={t.alt} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.scrim} />
            <ThemedText type="title" style={styles.onPhoto}>
              {CATEGORY_LABELS[t.category]}
            </ThemedText>
            <ThemedText type="smallStrong" style={styles.onPhoto}>
              {count(t.category)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.tiles}>
        {ICON_TYPES.map((t) => (
          <Pressable
            key={t.category}
            {...motion({ lift: '' })}
            role="link"
            onPress={() => open(t.category)}
            style={[styles.iconTile, { backgroundColor: theme.backgroundElement }, wide && styles.iconTileWide]}>
            <View style={[styles.iconBadge, { backgroundColor: theme.brandSoft }]}>
              <SymbolView name={t.icon} tintColor={theme.link} size={22} />
            </View>
            <ThemedText type="subheading">{CATEGORY_LABELS[t.category]}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {count(t.category)}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </Section>
  );
}

function FeaturedPosts() {
  const wide = useIsWide(900);
  const events = usePostSearch('', { kind: 'event', sort: 'recent' }, 'landing').data?.pages.flat() ?? [];
  const sponsors = usePostSearch('', { kind: 'sponsor', sort: 'recent' }, 'landing').data?.pages.flat() ?? [];
  const lists = [
    { title: 'Events looking for sponsors', href: { pathname: '/find', params: { kind: 'event' } } as Href, posts: events },
    { title: 'Sponsors looking for events', href: '/sponsors' as Href, posts: sponsors },
  ].filter((list) => list.posts.length > 0);
  if (!lists.length) return null;

  // With only a few posts the two lists sit side by side; once there are more, each becomes a carousel.
  if (wide && lists.length === 2 && events.length <= 2 && sponsors.length <= 2)
    return (
      <Section>
        <View style={[styles.split, styles.row]}>
          {lists.map((list) => (
            <View key={list.title} style={[styles.fill, styles.listColumn]}>
              <View style={styles.listHead}>
                <ThemedText type="title" level={2} style={styles.fill}>
                  {list.title}
                </ThemedText>
                <SeeAll href={list.href} />
              </View>
              {list.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </View>
          ))}
        </View>
      </Section>
    );
  return (
    <Section>
      <View style={styles.stack}>
        {lists.map((list) => (
          <Carousel key={list.title} title={list.title} action={<SeeAll href={list.href} />} itemWidth={360}>
            {list.posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </Carousel>
        ))}
      </View>
    </Section>
  );
}

function Showcases() {
  const { data } = useShowcases();
  if (!data?.length) return null;
  return (
    <Section tinted>
      <Carousel title="Showcase: events on Maple" action={<SeeAll href="/showcase" />} itemWidth={360}>
        {data.map((s) => (
          <ShowcaseCard key={s.id} showcase={s} width="100%" />
        ))}
      </Carousel>
    </Section>
  );
}

function WhyMaple() {
  const theme = useTheme();
  const wide = useIsWide(900);
  return (
    <Section>
      <View style={[styles.split, wide && styles.row]}>
        <Image
          source={PHOTOS.sponsor}
          accessibilityLabel="Two people shaking hands"
          style={[styles.splitPhoto, wide && styles.splitPhotoWide]}
          contentFit="cover"
        />
        <View style={[styles.splitText, wide && styles.fill]}>
          <ThemedText type="title" level={2}>
            Why organizations choose Maple
          </ThemedText>
          {TRUST.map((item) => (
            <View key={item.title} style={styles.point}>
              <View style={[styles.iconBadge, { backgroundColor: theme.brandSoft }]}>
                <SymbolView name={item.icon} tintColor={theme.link} size={22} />
              </View>
              <View style={[styles.fill, styles.pointText]}>
                <ThemedText type="subheading" level={3}>
                  {item.title}
                </ThemedText>
                <ThemedText themeColor="textSecondary">{item.body}</ThemedText>
              </View>
            </View>
          ))}
          <SeeAll href="/trust" label="Trust and safety" />
        </View>
      </View>
    </Section>
  );
}

// The steps advance on their own every 5 seconds (the bar under the active step fills in that time),
// stop once someone picks a step, and hold still for visitors who ask for reduced motion.
function Steps() {
  const theme = useTheme();
  const wide = useIsWide(900);
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);
  const [picked, setPicked] = useState(false);
  const auto = !reduceMotion && !picked;
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % STEPS.length), 5000);
    return () => clearInterval(timer);
  }, [auto]);

  return (
    <View style={[styles.split, wide && styles.row]}>
      <View style={[styles.splitText, wide && styles.fill]}>
        <ThemedText type="title" level={2}>
          How it works
        </ThemedText>
        <View role="tablist" style={styles.stepList}>
          {STEPS.map((step, i) => {
            const on = i === active;
            return (
              <Pressable
                key={step.title}
                role="tab"
                aria-selected={on}
                onPress={() => {
                  setPicked(true);
                  setActive(i);
                }}
                style={styles.step}>
                <View style={[styles.track, { backgroundColor: theme.border }]}>
                  {on && (
                    <View
                      key={active}
                      {...motion(auto ? { fill: '' } : {})}
                      style={[styles.trackFill, { backgroundColor: theme.brand }]}
                    />
                  )}
                </View>
                <ThemedText type="subheading" themeColor={on ? 'text' : 'textSecondary'}>
                  {i + 1}. {step.title}
                </ThemedText>
                {on && (
                  <View {...motion({ open: '' })}>
                    <ThemedText themeColor="textSecondary">{step.body}</ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
        <SeeAll href="/how-it-works" label="How it works in detail" />
      </View>
      <View style={[styles.stepArt, wide && styles.stepArtWide]}>
        {STEPS.map((step, i) => (
          <View
            key={step.title}
            {...motion({ crossfade: '' })}
            aria-hidden={i !== active}
            style={[StyleSheet.absoluteFill, { opacity: i === active ? 1 : 0 }]}>
            <Image source={step.image} accessibilityLabel={step.alt} style={styles.cover} contentFit="cover" />
          </View>
        ))}
      </View>
    </View>
  );
}

function Faq() {
  const theme = useTheme();
  const wide = useIsWide(900);
  const [open, setOpen] = useState<string | null>(FAQ[0].q);
  return (
    <View style={[styles.split, wide && styles.row]}>
      <View style={[styles.faqIntro, wide && styles.faqIntroWide]}>
        <ThemedText type="title" level={2}>
          Questions
        </ThemedText>
        <ThemedText themeColor="textSecondary">Can’t find your answer? Write to us.</ThemedText>
        <SeeAll href="/contact" label="Contact" />
      </View>
      <View style={wide && styles.fill}>
        {FAQ.map((item) => {
          const expanded = open === item.q;
          return (
            <View key={item.q} style={[styles.faqItem, { borderBottomColor: theme.border }]}>
              <Pressable
                role="button"
                aria-expanded={expanded}
                onPress={() => setOpen(expanded ? null : item.q)}
                style={styles.faqQuestion}>
                <ThemedText type="subheading" level={3} style={styles.fill}>
                  {item.q}
                </ThemedText>
                <View {...motion({ turn: '' })} style={{ transform: [{ rotate: expanded ? '45deg' : '0deg' }] }}>
                  <ThemedText type="heading" themeColor="textSecondary">
                    +
                  </ThemedText>
                </View>
              </Pressable>
              {expanded && (
                <View {...motion({ open: '' })}>
                  <ThemedText themeColor="textSecondary">{item.a}</ThemedText>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function FinalCta() {
  const theme = useTheme();
  return (
    <View style={[styles.cta, { backgroundColor: theme.brandSoft }]}>
      {/* Texture only: blurred and faint so the headline and both buttons stay readable. */}
      <Image source={PHOTOS.cta} alt="" blurRadius={10} style={[StyleSheet.absoluteFill, styles.ctaPhoto]} contentFit="cover" />
      <ThemedText type="title" level={2} style={[styles.center, styles.measure]}>
        Post your event once. Let sponsors come to you.
      </ThemedText>
      <View style={[styles.buttons, styles.centerRow]}>
        <Button title="Post your event free" onPress={() => router.push('/posts/new')} />
        <Button title="Find sponsors" variant="secondary" onPress={() => router.push('/sponsors')} />
      </View>
    </View>
  );
}

function StickyBar() {
  const theme = useTheme();
  const wide = useIsWide();
  return (
    <View {...motion({ bar: '' })} style={[styles.sticky, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
      <View style={styles.stickyInner}>
        {wide && <ThemedText type="bodyStrong">Post your event once. Sponsors send you proposals.</ThemedText>}
        <View style={styles.buttons}>
          <Button title="Post your event free" onPress={() => router.push('/posts/new')} />
          <Button title="Find sponsors" variant="secondary" onPress={() => router.push('/sponsors')} />
        </View>
      </View>
    </View>
  );
}

function SeeAll({ href, label = 'See all' }: { href: Href; label?: string }) {
  return (
    <Link href={href}>
      <ThemedText type="bodyStrong" themeColor="link">
        {label} →
      </ThemedText>
    </Link>
  );
}

function Section({ children, title, tinted }: { children: ReactNode; title?: string; tinted?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, tinted && { backgroundColor: theme.backgroundElement }]}>
      <View {...motion({ reveal: '' })} style={styles.sectionInner}>
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
  fill: { flex: 1 },
  row: { flexDirection: 'row' },
  center: { textAlign: 'center' },
  centerRow: { justifyContent: 'center' },
  measure: { maxWidth: 620 },
  cover: { width: '100%', height: '100%' },
  section: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.six + Spacing.three },
  sectionInner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.five },
  stack: { gap: Spacing.six },
  listColumn: { gap: Spacing.three },
  listHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.one },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },

  heroBand: { paddingHorizontal: Spacing.four, paddingTop: Spacing.six, paddingBottom: Spacing.six + Spacing.five },
  hero: { gap: Spacing.six, alignItems: 'center' },
  heroText: { gap: Spacing.four, alignSelf: 'stretch' },
  heroTextWide: { flex: 1.15, alignSelf: 'center' },
  heroTitle: { fontSize: 40, lineHeight: 44, fontWeight: 700, letterSpacing: -1.4 },
  heroTitleWide: { fontSize: 50, lineHeight: 54, letterSpacing: -1.8 },
  heroActions: { gap: Spacing.four },
  heroSearch: { height: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: Spacing.four, fontSize: 16, maxWidth: 520 },
  heroArt: { alignSelf: 'stretch' },
  heroArtWide: { flex: 1 },
  heroPhoto: { width: '100%', height: 280, borderRadius: 20 },
  heroPhotoWide: { height: 520, borderRadius: 28 },
  heroCard: {
    marginTop: -56,
    marginHorizontal: Spacing.three,
    borderRadius: 16,
    boxShadow: '0 24px 48px -24px rgba(60, 24, 12, 0.4)',
  },
  heroCardWide: { position: 'absolute', left: -56, bottom: -40, width: 380, marginTop: 0, marginHorizontal: 0 },

  logos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.five },

  bento: { gap: Spacing.three },
  photoTile: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    padding: Spacing.four,
    justifyContent: 'flex-end',
    gap: Spacing.half,
  },
  scrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(24, 12, 8, 0.42)' },
  onPhoto: { color: '#FFFFFF' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  iconTile: { flexGrow: 1, flexBasis: '45%', minHeight: 150, borderRadius: 20, padding: Spacing.four, gap: Spacing.two },
  iconTileWide: { flexBasis: '22%' },
  iconBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  split: { gap: Spacing.five },
  splitText: { gap: Spacing.four, justifyContent: 'center' },
  splitPhoto: { width: '100%', height: 260, borderRadius: 24 },
  splitPhotoWide: { flex: 1, width: undefined, height: 460 },
  point: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  pointText: { gap: Spacing.one },

  stepList: { gap: Spacing.two },
  step: { gap: Spacing.two, paddingVertical: Spacing.two },
  track: { height: 3, borderRadius: 2, overflow: 'hidden' },
  trackFill: { height: 3, width: '100%' },
  stepArt: { height: 280, borderRadius: 24, overflow: 'hidden' },
  stepArtWide: { flex: 1, height: 440 },

  faqIntro: { gap: Spacing.three },
  faqIntroWide: { width: 320 },
  faqItem: { borderBottomWidth: 1, paddingVertical: Spacing.three, gap: Spacing.two },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 44 },

  cta: {
    borderRadius: 28,
    overflow: 'hidden',
    paddingVertical: Spacing.six + Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.four,
  },
  ctaPhoto: { opacity: 0.09 },

  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    boxShadow: '0 -12px 32px -20px rgba(60, 24, 12, 0.35)',
  },
  stickyInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
});
