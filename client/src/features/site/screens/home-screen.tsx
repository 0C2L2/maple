import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link, Redirect, router, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

type Side = 'organizers' | 'sponsors';
const SIDES: { value: Side; label: string }[] = [
  { value: 'organizers', label: 'For organizers' },
  { value: 'sponsors', label: 'For sponsors' },
];
// Three cards per side; the first (no photo) is the animated Maple card.
const HOW: Record<Side, { caption: string; image?: number; alt?: string }[]> = {
  organizers: [
    { caption: 'Posting your event is always free' },
    {
      caption: 'Get proposals from sponsors',
      image: require('@/assets/images/site/habsida-judges.webp'),
      alt: 'Judges and mentors watching a team demo at the HABSIDA Hackathon',
    },
    {
      caption: 'Pick sponsors and run your event',
      image: require('@/assets/images/site/habsida-group.webp'),
      alt: 'Everyone at the HABSIDA Hackathon under the event banner',
    },
  ],
  sponsors: [
    { caption: 'Posting what you back is always free' },
    {
      caption: 'Find events that reach your audience',
      image: require('@/assets/images/site/habsida-team.webp'),
      alt: 'An international team at the HABSIDA Hackathon with their second-place certificate',
    },
    {
      caption: 'Send a proposal and close the deal',
      image: require('@/assets/images/site/habsida-winners.webp'),
      alt: 'The winning team at the HABSIDA Hackathon holding the ₩1,500,000 first prize',
    },
  ],
};

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
    a: 'Yes, during early access. Posting, messaging, and reviews stay free. Later, organizers pay a fee only on cash deals paid through Maple and on extra proposals. Sponsors never pay. The pricing page has the details.',
  },
  {
    q: 'Can one organization both run events and sponsor others?',
    a: 'Yes. Post an event you run, and post the events you want to sponsor, from the same organization page.',
  },
  {
    q: 'Does Maple handle payments?',
    a: 'Not yet. Soon sponsors will pay through Maple, and we’ll pay the organizer after the event, once the results report is in. Until then, organizations agree the payment directly. Our trust and safety page has tips for doing that safely.',
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
          <HowItWorks />
        </Section>
        <Section>
          <BothSides />
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

// The logo strip: members and partners in the order staff set in /admin → Logos (strip_logos()). It appears once
// there are enough logos to read as a strip.
function Organizations() {
  const { data } = useQuery({
    queryKey: ['strip-logos'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('strip_logos');
      if (error) throw error;
      return data as { key: string; name: string; logo_url: string; href: string | null }[];
    },
  });
  const { session } = useSession();
  const me = session?.user.id;
  const { data: myLogo } = useQuery({
    queryKey: ['organizations', 'my-logo', me],
    enabled: !!me,
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('logo_url').eq('id', me!).maybeSingle();
      if (error) throw error;
      return (data?.logo_url as string | null) ?? null;
    },
  });
  if (!data || data.length < 4) return null;
  // One invite tile per run: new visitors sign up; signed-in organizations without a logo add one in Settings.
  const invite = me
    ? myLogo === null
      ? { href: '/settings' as const, label: 'Add your logo', a11y: 'Add your logo to Maple' }
      : null
    : { href: '/signup' as const, label: 'Your logo here', a11y: 'Add your organization to Maple' };
  const open = (href: string) => (/^https?:/.test(href) ? Linking.openURL(href) : router.push(href as Href));
  return (
    <Section>
      <ThemedText type="smallStrong" themeColor="textSecondary" style={styles.center}>
        Organizations on Maple
      </ThemedText>
      {/* A scrolling strip like Cloudflare's (global.css [data-marquee]): each run is the organizations then the
          invite tile; runs repeat to fill the width, and the whole strip repeats once so the loop is seamless.
          Every item is the same Pressable box (a bare Link renders inline text, which sat lower). Only the first
          run is reachable by keyboard and screen readers; the repeats are hidden from them. */}
      <View {...motion({ marquee: '' })}>
        <View {...motion({ track: '' })} style={styles.logos}>
          {Array.from({ length: 2 * Math.ceil(12 / (data.length + 1)) }, (_, run) =>
            [
              ...data.map((logo) => ({ key: logo.key, href: logo.href, label: logo.name, logo })),
              ...(invite ? [{ key: 'invite', href: invite.href as string, label: invite.a11y, logo: null }] : []),
            ].map((item) => {
              const key = `${run}-${item.key}`;
              const content = item.logo ? (
                <OrgLogo name={item.logo.name} url={item.logo.logo_url} size={56} />
              ) : (
                <LogoInvite label={invite!.label} />
              );
              // A partner without a link is only a picture.
              if (!item.href)
                return (
                  <View key={key} aria-hidden={run > 0} style={styles.logo}>
                    {content}
                  </View>
                );
              return (
                <Pressable
                  key={key}
                  role={run === 0 ? 'link' : undefined}
                  aria-label={run === 0 ? item.label : undefined}
                  aria-hidden={run > 0}
                  focusable={run === 0}
                  onPress={() => open(item.href!)}
                  style={styles.logo}>
                  {content}
                </Pressable>
              );
            }),
          )}
        </View>
      </View>
    </Section>
  );
}

// Made-up example proposals for the "both sides" section (not real organizations or deals).
const EXAMPLES = [
  { name: 'Nuri Labs', pkg: 'Gold package', value: '₩4,000,000' },
  { name: 'Hanbit Coffee', pkg: 'Food and venue', value: 'In-kind' },
  { name: 'Blue Wave Studio', pkg: 'Silver package', value: '₩2,000,000' },
  { name: 'Daon Cloud', pkg: 'Cloud credits', value: 'In-kind' },
  { name: 'Pixel Bank', pkg: 'Prize track', value: '₩1,500,000' },
  { name: 'Maru Games', pkg: 'Community package', value: '₩700,000' },
];
const AGES = ['just now', '1 hour ago', 'yesterday', '2 days ago'];
const FADE = [1, 0.8, 0.5, 0.25];

// Cloudflare-style bento: a live-looking list of proposals (a new one arrives every few seconds and moves
// New → In talks → Won as it ages) beside a maple-red card about the one marketplace. Still for reduced motion.
function BothSides() {
  const theme = useTheme();
  const wide = useIsWide(900);
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setTick((t) => t + 1), 3000);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  const rows = AGES.map((age, i) => {
    const n = tick - i;
    return { n, age, ...EXAMPLES[((n % EXAMPLES.length) + EXAMPLES.length) % EXAMPLES.length] };
  });

  return (
    <>
      <View style={styles.bothHead}>
        <ThemedText type="title" level={2} style={styles.center}>
          Built for both sides of the deal
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          Easy for an organizer’s first hackathon and for a company sponsoring ten events a year.
        </ThemedText>
      </View>
      <View style={[styles.bento, wide && styles.row]}>
        <View style={[styles.bothCard, wide && { flex: 2 }, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="caption" themeColor="textSecondary">
            EXAMPLE PROPOSALS
          </ThemedText>
          <View style={styles.bothList}>
            {rows.map((r, i) => (
              <View
                key={r.n}
                {...motion(i === 0 && !reduceMotion ? { open: '' } : {})}
                style={[styles.bothRow, { backgroundColor: theme.brandSoft, opacity: FADE[i] }]}>
                <ThemedText type="smallStrong" numberOfLines={1} style={[styles.fill, { color: theme.link }]}>
                  {r.name} · {r.pkg}
                </ThemedText>
                {wide && (
                  <ThemedText type="small" numberOfLines={1} style={[styles.fill, { color: theme.link }]}>
                    {r.value} · {r.age}
                  </ThemedText>
                )}
                <DealStatus step={i} />
              </View>
            ))}
          </View>
          <ThemedText type="subheading" level={3}>
            Every proposal in one place
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Shortlist, talk, and mark deals Won, without spreadsheets or cold email.
          </ThemedText>
        </View>
        <Link href="/how-it-works" asChild>
          <Pressable
            {...motion({ lift: '' })}
            style={StyleSheet.flatten([styles.bothCard, wide && { flex: 1 }, { backgroundColor: theme.brand, borderColor: theme.brand }])}>
            <SymbolView name={{ ios: 'arrow.triangle.2.circlepath', android: 'handshake', web: 'handshake' }} tintColor={theme.onBrand} size={32} />
            <ThemedText type="subheading" level={3} style={{ color: theme.onBrand }}>
              One marketplace for organizers and sponsors
            </ThemedText>
            <ThemedText style={{ color: theme.onBrand }}>
              Post your event or what you back, get proposals, talk, and close the deal. One page, one inbox, one history
              of reviews.
            </ThemedText>
            <ThemedText type="bodyStrong" style={{ color: theme.onBrand }}>
              How it works →
            </ThemedText>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

// A proposal's status by age in the example list: New (a dot), In talks (spinning), then Won (a check).
function DealStatus({ step }: { step: number }) {
  const theme = useTheme();
  const label = step === 0 ? 'New' : step === 1 ? 'In talks' : 'Won';
  return (
    <View style={styles.status}>
      <ThemedText type="smallStrong" style={{ color: theme.link }}>
        {label}
      </ThemedText>
      {step === 0 && <View style={[styles.dotSmall, { backgroundColor: theme.link }]} />}
      {step === 1 && <View {...motion({ spin: '' })} style={[styles.spinner, { borderColor: theme.link }]} />}
      {step >= 2 && <SymbolView name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} tintColor={theme.link} size={20} />}
    </View>
  );
}

// A dashed "+" tile the size of a logo, with its label beside it; it turns maple red on hover (global.css [data-nav]).
function LogoInvite({ label }: { label: string }) {
  const theme = useTheme();
  return (
    <View {...motion({ nav: '' })} style={styles.invite}>
      <View style={[styles.inviteBox, { borderColor: theme.textSecondary }]}>
        <ThemedText type="subheading" themeColor="textSecondary">
          +
        </ThemedText>
      </View>
      <ThemedText type="smallStrong" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
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

// Upwork-style: a For organizers / For sponsors switch and three picture cards with a caption each. The cards rise
// in one after another when the side changes; the first card's gradient drifts until paused. Visitors who ask for
// reduced motion get still cards and no pause button.
function HowItWorks() {
  const theme = useTheme();
  const wide = useIsWide(900);
  const reduceMotion = useReducedMotion();
  const [side, setSide] = useState<Side>('organizers');
  const [playing, setPlaying] = useState(true);

  return (
    <>
      <View style={[styles.howHead, wide && styles.howHeadWide]}>
        <ThemedText type="title" level={2}>
          How it works
        </ThemedText>
        <View role="tablist" aria-label="How it works for" style={[styles.toggle, { borderColor: theme.border }]}>
          {SIDES.map((s) => {
            const on = s.value === side;
            return (
              <Pressable
                key={s.value}
                role="tab"
                aria-selected={on}
                onPress={() => setSide(s.value)}
                style={[styles.toggleItem, on && { borderColor: theme.text }]}>
                <ThemedText>{s.label}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.howCards, wide && styles.row]}>
        {HOW[side].map((card, i) => (
          <View key={`${side}-${i}`} {...motion({ enter: i })} style={[styles.howCard, wide && styles.fill]}>
            {card.image ? (
              <Image
                source={card.image}
                accessibilityLabel={card.alt}
                style={[styles.howArt, wide && styles.howArtWide]}
                contentFit="cover"
              />
            ) : (
              <View
                {...motion({ drift: playing ? '' : 'paused' })}
                style={[styles.howArt, wide && styles.howArtWide, styles.driftArt, { backgroundColor: theme.brandSoft }]}>
                <View style={styles.driftBrand}>
                  <Image source={require('@/assets/images/logo.png')} style={styles.driftLogo} contentFit="contain" />
                  <ThemedText style={styles.driftWordmark}>Maple</ThemedText>
                </View>
                <Link href={{ pathname: '/signup', params: { role: side === 'sponsors' ? 'sponsor' : 'organizer' } }}>
                  <ThemedText type="bodyStrong">Get started</ThemedText>
                </Link>
                {!reduceMotion && (
                  <Pressable
                    role="button"
                    accessibilityLabel={playing ? 'Pause animation' : 'Play animation'}
                    onPress={() => setPlaying(!playing)}
                    style={[styles.pause, { backgroundColor: theme.background }]}>
                    <SymbolView
                      name={
                        playing
                          ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                          : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                      }
                      tintColor={theme.text}
                      size={20}
                    />
                  </Pressable>
                )}
              </View>
            )}
            <ThemedText type="lead" style={styles.howCaption}>
              {card.caption}
            </ThemedText>
          </View>
        ))}
      </View>
      <SeeAll href={{ pathname: '/how-it-works', params: { for: side } }} label="How it works in detail" />
    </>
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
        {/* Phones: two equal halves, with a shorter first label so both fit. */}
        <View style={[styles.buttons, !wide && styles.stickyNarrow]}>
          <View style={!wide && styles.fill}>
            <Button title={wide ? 'Post your event free' : 'Post free'} onPress={() => router.push('/posts/new')} />
          </View>
          <View style={!wide && styles.fill}>
            <Button title="Find sponsors" variant="secondary" onPress={() => router.push('/sponsors')} />
          </View>
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

  logos: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  // Spacing is padding, not gap, so both halves of the strip are exactly the same width.
  logo: { paddingHorizontal: Spacing.five },
  bothHead: { gap: Spacing.two, alignItems: 'center' },
  bothCard: { borderWidth: 1, borderRadius: 20, padding: Spacing.four, gap: Spacing.three },
  bothList: { gap: Spacing.two, marginBottom: Spacing.two },
  bothRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 52,
    paddingHorizontal: Spacing.three,
    borderRadius: 10,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dotSmall: { width: 8, height: 8, borderRadius: 4 },
  spinner: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderTopColor: 'transparent' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  inviteBox: {
    width: 56,
    height: 56,
    borderRadius: 9,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },

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

  howHead: { gap: Spacing.three },
  howHeadWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggle: { flexDirection: 'row', alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999 },
  // Each segment overlaps the outline by a pixel so the picked one's dark border replaces it.
  toggleItem: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    margin: -1,
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 999,
  },
  howCards: { gap: Spacing.four },
  howCard: { gap: Spacing.three },
  howArt: { width: '100%', height: 220, borderRadius: 16, overflow: 'hidden' },
  howArtWide: { height: 260 },
  driftArt: { alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  driftBrand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  driftLogo: { width: 44, height: 44 },
  driftWordmark: { fontSize: 40, lineHeight: 48, fontWeight: 700, letterSpacing: -1 },
  pause: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 16px -8px rgba(0, 0, 0, 0.35)',
  },
  howCaption: { paddingHorizontal: Spacing.one },

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
  stickyNarrow: { flex: 1, flexWrap: 'nowrap', gap: Spacing.two },
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
