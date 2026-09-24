import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { useTheme } from '@/hooks/use-theme';

// Phone header: your logo on the left (opens your page), a new-post button on the right.
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

// Find is already a tab, so the phone header's right button starts a new post (the desktop bar's red Post).
export function PostButton() {
  const theme = useTheme();
  const { org } = useSession();
  if (!org) return null;
  return (
    <Link href="/posts/new" asChild>
      <Pressable accessibilityLabel="New post" hitSlop={8} style={styles.button}>
        <SymbolView name={{ ios: 'plus.circle', android: 'add_circle', web: 'add_circle' }} tintColor={theme.link} size={28} />
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: { marginHorizontal: Spacing.three },
});
