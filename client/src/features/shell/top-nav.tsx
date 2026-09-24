import { Image } from 'expo-image';
import { Link, router, usePathname, type Href } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useUnreadCount } from '@/features/notifications/use-unread';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useIsStaff } from '@/features/safety/use-is-staff';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { ThemeMenu } from '@/ui/theme-menu';

type Item = { href: Href; path: string; label: string; icon: SymbolViewProps['name'] };

const ITEMS: Item[] = [
  { href: '/find', path: '/find', label: 'Find', icon: { ios: 'magnifyingglass', android: 'search', web: 'search' } },
  { href: '/my-posts', path: '/my-posts', label: 'My posts', icon: { ios: 'briefcase', android: 'work', web: 'work' } },
  {
    href: '/proposals',
    path: '/proposals',
    label: 'Proposals',
    icon: { ios: 'tray.full', android: 'inbox', web: 'inbox' },
  },
  { href: '/messages', path: '/messages', label: 'Messaging', icon: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' } },
  { href: '/notifications', path: '/notifications', label: 'Notifications', icon: { ios: 'bell', android: 'notifications', web: 'notifications' } },
];

// The signed-in top bar on desktop web: logo, search, the main sections, a Post button, and the "Me" menu.
export function TopNav() {
  const theme = useTheme();
  const pathname = usePathname();
  const { org } = useSession();
  const unread = useUnreadCount();
  const { isStaff } = useIsStaff();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const search = () => router.push({ pathname: '/find', params: q.trim() ? { q: q.trim() } : {} });

  return (
    <View style={[styles.bar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <Link href="/find" asChild>
          <Pressable accessibilityLabel="Maple home">
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
          </Pressable>
        </Link>
        <TextInput
          accessibilityLabel="Search posts"
          placeholder="Search posts"
          placeholderTextColor={theme.textSecondary}
          value={q}
          onChangeText={setQ}
          onSubmitEditing={search}
          returnKeyType="search"
          style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />
        <View style={styles.spacer} />
        <Link href="/posts/new" asChild>
          {/* A Link child's style must be one flat object: Link's Slot can't merge style arrays. */}
          <Pressable accessibilityLabel="Post" style={StyleSheet.flatten([styles.postButton, { backgroundColor: theme.brand }])}>
            <Text style={[styles.postButtonText, { color: theme.onBrand }]}>Post</Text>
          </Pressable>
        </Link>
        {ITEMS.map((item) => {
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const color = active ? theme.text : theme.textSecondary;
          const badge = item.path === '/notifications' && unread > 0 ? unread : 0;
          return (
            <Link key={item.path} href={item.href} asChild>
              <Pressable
                aria-current={active ? 'page' : undefined}
                accessibilityLabel={badge ? `${item.label}, ${badge} unread` : item.label}
                // Link's Slot merges style objects, so a Link child's style must be one flat object.
                style={StyleSheet.flatten([styles.item, { borderBottomColor: active ? theme.text : 'transparent' }])}>
                <View>
                  <SymbolView name={item.icon} tintColor={color} size={24} />
                  {badge > 0 && (
                    <View style={[styles.badge, { backgroundColor: theme.brand }]}>
                      <Text style={[styles.badgeText, { color: theme.onBrand }]}>{badge > 9 ? '9+' : badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, { color }]}>{item.label}</Text>
              </Pressable>
            </Link>
          );
        })}
        <ThemeMenu />
        {org && (
          <View>
            <Pressable
              role="button"
              aria-expanded={menuOpen}
              accessibilityLabel="Me menu"
              onPress={() => setMenuOpen(!menuOpen)}
              style={[styles.item, { borderBottomColor: 'transparent' }]}>
              <OrgLogo name={org.name} url={org.logo_url} size={24} />
              <Text style={[styles.label, { color: theme.textSecondary }]}>Me ▾</Text>
            </Pressable>
            {menuOpen && (
              <View style={[styles.menu, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.menuHead}>
                  <OrgLogo name={org.name} url={org.logo_url} size={40} />
                  <View style={styles.menuHeadText}>
                    <Text style={[styles.menuName, { color: theme.text }]}>{org.name}</Text>
                    {org.tagline && (
                      <Text style={[styles.menuSub, { color: theme.textSecondary }]} numberOfLines={2}>
                        {org.tagline}
                      </Text>
                    )}
                  </View>
                </View>
                <MenuLink href={`/org/${org.handle}`} label="View our page" close={() => setMenuOpen(false)} />
                <MenuLink href="/my-posts" label="My posts" close={() => setMenuOpen(false)} />
                <MenuLink href="/proposals" label="Proposals" close={() => setMenuOpen(false)} />
                <MenuLink href="/settings" label="Settings" close={() => setMenuOpen(false)} />
                {isStaff && <MenuLink href="/admin" label="Maple admin" close={() => setMenuOpen(false)} />}
                <Pressable
                  role="menuitem"
                  onPress={async () => {
                    setMenuOpen(false);
                    await supabase.auth.signOut();
                    router.replace('/');
                  }}
                  style={styles.menuItem}>
                  <Text style={[styles.menuText, { color: theme.textSecondary }]}>Sign out</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function MenuLink({ href, label, close }: { href: Href; label: string; close: () => void }) {
  const theme = useTheme();
  return (
    <Link href={href} asChild onPress={close}>
      <Pressable role="menuitem" style={styles.menuItem}>
        <Text style={[styles.menuText, { color: theme.text }]}>{label}</Text>
      </Pressable>
    </Link>
  );
}

// Raw <Text> doesn't get ThemedText's font, so each text style names it.
const font = { fontFamily: Fonts.sans };

const styles = StyleSheet.create({
  bar: { borderBottomWidth: 1, paddingHorizontal: Spacing.three, zIndex: 10 },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: { width: 36, height: 36 },
  postButton: { borderRadius: 999, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  postButtonText: { ...font, fontSize: 14, fontWeight: 700 },
  search: { width: 260, height: 36, borderRadius: 6, paddingHorizontal: Spacing.three, fontSize: 14 },
  spacer: { flex: 1 },
  item: {
    minWidth: 76,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderBottomWidth: 2,
    paddingHorizontal: Spacing.one,
  },
  label: { ...font, fontSize: 12, lineHeight: 16 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { ...font, fontSize: 11, fontWeight: 700 },
  menu: {
    position: 'absolute',
    top: 58,
    right: 0,
    width: 260,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.two,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  menuHead: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, alignItems: 'center' },
  menuHeadText: { flex: 1 },
  menuName: { ...font, fontSize: 16, fontWeight: 700 },
  menuSub: { ...font, fontSize: 13 },
  menuText: font,
  menuItem: { paddingHorizontal: Spacing.three, paddingVertical: 10 },
});
