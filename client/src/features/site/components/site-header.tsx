import { Image } from 'expo-image';
import { Link, router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useDismiss } from '@/hooks/use-dismiss';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { motion } from '@/ui/motion';
import { ThemeMenu } from '@/ui/theme-menu';
import { ThemedText } from '@/ui/themed-text';

type NavLink = { label: string; href: Href };

// The footer's pages, grouped for the top bar like Upwork's (legal pages stay in the footer only).
const MENUS: { title: string; links: NavLink[] }[] = [
  {
    title: 'For organizers',
    links: [
      { label: 'Find sponsors', href: '/sponsors' },
      { label: 'Showcase', href: '/showcase' },
      { label: 'Post your event', href: { pathname: '/signup', params: { role: 'organizer' } } },
      { label: 'How it works', href: { pathname: '/how-it-works', params: { for: 'organizers' } } },
    ],
  },
  {
    title: 'For sponsors',
    links: [
      { label: 'Find events', href: { pathname: '/find', params: { kind: 'event' } } },
      { label: 'Post as a sponsor', href: { pathname: '/signup', params: { role: 'sponsor' } } },
      { label: 'How it works', href: { pathname: '/how-it-works', params: { for: 'sponsors' } } },
    ],
  },
  {
    title: 'Why Maple',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Trust and safety', href: '/trust' },
    ],
  },
];
const PAGES: NavLink[] = [
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
];

const CHEVRON = { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' } as const;

// Website header (web only), styled like Upwork's: logo, section menus, plain page links, then Sign in as text next
// to one filled button. Narrow screens fold it all into one menu.
export function SiteHeader() {
  const theme = useTheme();
  const wide = useIsWide(1100);
  const { session } = useSession();
  const [open, setOpen] = useState(false); // the narrow-screen menu
  const [menu, setMenu] = useState<string | null>(null); // the open dropdown on wide screens

  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };
  const link = (label: string, href: Href) => (
    <View key={label} {...motion({ nav: '' })}>
      <Link href={href} onPress={() => setOpen(false)}>
        <ThemedText style={styles.link}>{label}</ThemedText>
      </Link>
    </View>
  );

  return (
    <View style={[styles.bar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <Link href="/" asChild>
          <Pressable accessibilityLabel="Maple home" style={styles.brand}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
            <ThemedText style={styles.wordmark}>Maple</ThemedText>
          </Pressable>
        </Link>
        {wide && (
          <View style={styles.nav}>
            {MENUS.map((m) => (
              <NavMenu
                key={m.title}
                title={m.title}
                links={m.links}
                open={menu === m.title}
                onToggle={(show) => setMenu(show ? m.title : null)}
              />
            ))}
            {PAGES.map((p) => link(p.label, p.href))}
          </View>
        )}
        <View style={styles.actions}>
          <ThemeMenu />
          {session ? (
            <Button title="Open Maple" onPress={() => go('/find')} />
          ) : (
            <>
              {wide && link('Sign in', '/login')}
              <Button title="Join free" onPress={() => go('/signup')} />
            </>
          )}
          {!wide && (
            <Pressable
              role="button"
              aria-expanded={open}
              accessibilityLabel="Menu"
              onPress={() => setOpen(!open)}
              style={styles.menuButton}>
              <SymbolView
                name={open ? { ios: 'xmark', android: 'close', web: 'close' } : { ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
                tintColor={theme.text}
                size={24}
              />
            </Pressable>
          )}
        </View>
      </View>
      {!wide && open && (
        <View style={[styles.menu, { borderTopColor: theme.border }]}>
          {MENUS.map((m) => (
            <View key={m.title} style={styles.group}>
              <ThemedText type="caption" themeColor="textSecondary">
                {m.title.toUpperCase()}
              </ThemedText>
              {m.links.map((l) => link(l.label, l.href))}
            </View>
          ))}
          {PAGES.map((p) => link(p.label, p.href))}
          {!session && link('Sign in', '/login')}
        </View>
      )}
    </View>
  );
}

// One section's dropdown: the title opens a menu of links; picking one, Escape, or a click outside closes it.
function NavMenu({
  title,
  links,
  open,
  onToggle,
}: {
  title: string;
  links: NavLink[];
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const theme = useTheme();
  const box = useRef<View>(null);
  useDismiss(open, () => onToggle(false), box);
  return (
    <View ref={box}>
      <Pressable
        {...motion({ nav: '' })}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onPress={() => onToggle(!open)}
        style={styles.trigger}>
        <ThemedText style={open && { color: theme.link }}>{title}</ThemedText>
        <SymbolView name={CHEVRON} tintColor={open ? theme.link : theme.textSecondary} size={16} />
      </Pressable>
      {open && (
        <View
          {...motion({ open: '' })}
          role="menu"
          aria-label={title}
          style={[styles.dropdown, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {links.map((l) => (
            <Link key={l.label} href={l.href} asChild onPress={() => onToggle(false)}>
              <Pressable {...motion({ press: 'secondary' })} role="menuitem" style={styles.item}>
                <ThemedText>{l.label}</ThemedText>
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Above the page so the menus can open over it.
  bar: { borderBottomWidth: 1, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, zIndex: 10 },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logo: { width: 32, height: 32 },
  wordmark: { fontSize: 22, lineHeight: 28, fontWeight: 700 },
  nav: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.four + Spacing.one, marginLeft: Spacing.four },
  link: { paddingVertical: Spacing.two },
  trigger: { flexDirection: 'row', alignItems: 'center', gap: Spacing.half, paddingVertical: Spacing.two },
  dropdown: {
    position: 'absolute',
    top: 44,
    left: -Spacing.three,
    zIndex: 20,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.one,
    gap: Spacing.half,
    boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.4)',
  },
  item: { justifyContent: 'center', minHeight: 44, paddingHorizontal: Spacing.three, borderRadius: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginLeft: 'auto' },
  menuButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menu: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
  group: { gap: 0 },
});
