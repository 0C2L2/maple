import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import { CONTACT_EMAIL } from '@/constants/site';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SiteFooter() {
  const theme = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: theme.border }]}>
      <View style={styles.inner}>
        <ThemedText type="small" themeColor="textSecondary">
          © {new Date().getFullYear()} Maple
        </ThemedText>
        <View style={styles.links}>
          <Link href="/legal/privacy">
            <ThemedText type="small" themeColor="textSecondary">
              Privacy
            </ThemedText>
          </Link>
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
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  links: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
});
