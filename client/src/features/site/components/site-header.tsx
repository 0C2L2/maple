import { Image } from 'expo-image';
import { Link, router, usePathname, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { ThemeMenu } from '@/ui/theme-menu';
import { ThemedText } from '@/ui/themed-text';

// The website's main sections, in Wishket's order: post, browse each side, past events, how it works.
const NAV: { label: string; href: Href; path?: string }[] = [
  { label: 'Post your event', href: '/posts/new', path: '/posts/new' },
  { label: 'Find events', href: { pathname: '/find', params: { kind: 'event' } } },
  { label: 'Find sponsors', href: '/sponsors', path: '/sponsors' },
  { label: 'Showcase', href: '/showcase', path: '/showcase' },
  { label: 'How it works', href: '/how-it-works', path: '/how-it-works' },
];

// Website header (web only): logo, sections, and sign-in. Phones fold the sections into a menu.
export function SiteHeader() {
  const theme = useTheme();
  const wide = useIsWide(1180); // five sections plus two buttons need room; narrower screens get the menu
  const pathname = usePathname();
  const { session } = useSession();
  const [open, setOpen] = useState(false);

  const go = (href: Href) => {
    setOpen(false);
    router.push(href);
  };
  const link = (label: string, href: Href, current = false) => (
    <Link key={label} href={href} onPress={() => setOpen(false)}>
      <ThemedText
        type="bodyStrong"
        themeColor={href === '/posts/new' ? 'link' : current ? 'text' : 'textSecondary'}
        style={styles.link}>
        {label}
      </ThemedText>
    </Link>
  );
  const links = NAV.map((item) => link(item.label, item.href, item.path === pathname));

  return (
    <View style={[styles.bar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <Link href="/" asChild>
          <Pressable accessibilityLabel="Maple home" style={styles.brand}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
            <ThemedText style={styles.wordmark}>Maple</ThemedText>
          </Pressable>
        </Link>
        {wide && <View style={styles.nav}>{links}</View>}
        <View style={styles.actions}>
          <ThemeMenu />
          {session ? (
            <Button title="Open Maple" onPress={() => go('/find')} />
          ) : (
            <>
              {wide && <Button title="Sign in" variant="secondary" onPress={() => go('/login')} />}
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
          {links}
          {!session && link('Sign in', '/login')}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Above the page so the mode menu can open over it.
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
  nav: { flex: 1, flexDirection: 'row', gap: Spacing.four, marginLeft: Spacing.four },
  link: { paddingVertical: Spacing.two },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginLeft: 'auto' },
  menuButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  menu: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    borderTopWidth: 1,
    marginTop: Spacing.two,
    paddingTop: Spacing.one,
  },
});
