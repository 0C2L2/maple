import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import { CONTACT_EMAIL } from '@/constants/site';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const COLUMNS: { title: string; links: { label: string; href: Href }[] }[] = [
  {
    title: 'Maple',
    links: [
      { label: 'About', href: '/about' },
      { label: 'How it works', href: '/how-it-works' },
      { label: 'Trust and safety', href: '/trust' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
    ],
  },
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
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/legal/terms' },
      { label: 'Privacy', href: '/legal/privacy' },
      { label: 'Community guidelines', href: '/legal/community' },
    ],
  },
];

export function SiteFooter() {
  const theme = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <View style={styles.inner}>
        <View style={styles.columns}>
          {COLUMNS.map((column) => (
            <View key={column.title} style={styles.column}>
              <ThemedText type="smallStrong">{column.title}</ThemedText>
              {column.links.map((item) => (
                <Link key={item.label} href={item.href}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.link}>
                    {item.label}
                  </ThemedText>
                </Link>
              ))}
            </View>
          ))}
        </View>
        <View style={[styles.bottom, { borderTopColor: theme.border }]}>
          <ThemedText type="small" themeColor="textSecondary">
            © {new Date().getFullYear()} Maple
          </ThemedText>
          <Link href={`mailto:${CONTACT_EMAIL}`}>
            <ThemedText type="small" themeColor="textSecondary">
              {CONTACT_EMAIL}
            </ThemedText>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1, paddingHorizontal: Spacing.four, paddingVertical: Spacing.five },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', gap: Spacing.four },
  columns: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.five },
  column: { minWidth: 150, gap: Spacing.one },
  link: { paddingVertical: Spacing.one },
  bottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
    borderTopWidth: 1,
    paddingTop: Spacing.three,
  },
});
