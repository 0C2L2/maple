import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { ThemedText } from '@/ui/themed-text';

// Website header, rendered by the (public) layout on web only.
export function SiteHeader() {
  const theme = useTheme();
  const { session } = useSession();
  return (
    <View style={[styles.bar, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
      <View style={styles.inner}>
        <Link href="/" asChild>
          <Pressable accessibilityLabel="Maple home" style={styles.brand}>
            <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
            <ThemedText style={styles.wordmark}>Maple</ThemedText>
          </Pressable>
        </Link>
        {session ? (
          <Button title="Open Maple" onPress={() => router.push('/find')} />
        ) : (
          <View style={styles.actions}>
            <Button title="Sign in" variant="secondary" onPress={() => router.push('/login')} />
            <Button title="Join free" onPress={() => router.push('/login')} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  logo: {
    width: 32,
    height: 32,
  },
  wordmark: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
});
