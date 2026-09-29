import { Image } from 'expo-image';
import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';

type FooterLink = { label: string; href: Href };

// The main paths only; organizer and sponsor pages live in the header menus.
const MAIN: FooterLink[] = [
  { label: 'About', href: '/about' },
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Showcase', href: '/showcase' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Trust and safety', href: '/trust' },
  { label: 'Contact', href: '/contact' },
];
const LEGAL: FooterLink[] = [
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Community guidelines', href: '/legal/community' },
];

// A quiet footer: the brand with one line about Maple, one row of main links, then legal links under a hairline.
export function SiteFooter() {
  const theme = useTheme();
  const link = (item: FooterLink, type: 'default' | 'small') => (
    <View key={item.label} {...motion({ nav: '' })}>
      <Link href={item.href}>
        <ThemedText type={type} themeColor="textSecondary" style={styles.link}>
          {item.label}
        </ThemedText>
      </Link>
    </View>
  );
  return (
    <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <View style={styles.inner}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <View style={styles.brandRow}>
              <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
              <ThemedText type="heading">Maple</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              The sponsorship marketplace for events, starting in Korea.
            </ThemedText>
          </View>
          <View role="navigation" aria-label="Footer" style={styles.links}>
            {MAIN.map((item) => link(item, 'default'))}
          </View>
        </View>
        <View style={[styles.bottom, { borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            © {new Date().getFullYear()} Maple
          </ThemedText>
          <View style={styles.legal}>{LEGAL.map((item) => link(item, 'small'))}</View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six, paddingBottom: Spacing.five },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.five },
  top: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.five },
  brand: { gap: Spacing.two, maxWidth: 320 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  logo: { width: 28, height: 28 },
  links: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four, alignItems: 'center' },
  link: { paddingVertical: Spacing.one },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
  legal: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.four },
});
