import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';

// Phone header: your logo on the left (opens your page), search on the right.
export function MeButton() {
  const { org } = useSession();
  if (!org) return null;
  return (
    <Link href={`/org/${org.handle}`} asChild>
      <Pressable accessibilityLabel="Our page" hitSlop={8} style={styles.button}>
        <OrgLogo name={org.name} url={org.logo_url} size={30} />
      </Pressable>
    </Link>
  );
}

export function SearchButton() {
  const theme = useTheme();
  return (
    <Link href="/find" asChild>
      <Pressable accessibilityLabel="Search" hitSlop={8} style={styles.button}>
        <SymbolView name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} tintColor={theme.text} size={24} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: { marginHorizontal: Spacing.three },
});
