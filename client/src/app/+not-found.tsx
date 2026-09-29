import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Button } from '@/ui/button';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';
import { ThemedView } from '@/ui/themed-view';

// A branded "page not found": what happened, and two ways forward.
export default function NotFound() {
  return (
    <ThemedView style={styles.container}>
      <PageMeta title="Page not found" />
      <View style={styles.column}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} contentFit="contain" />
        <ThemedText type="caption" themeColor="link">
          Error 404
        </ThemedText>
        <ThemedText type="display" level={1} style={styles.center}>
          We couldn’t find that page.
        </ThemedText>
        <ThemedText type="lead" themeColor="textSecondary" style={styles.center}>
          The link may be old, or the page has moved. Everything else is right where you left it.
        </ThemedText>
        <View style={styles.actions}>
          <Button title="Go to the home page" onPress={() => router.replace('/')} />
          <Link href={{ pathname: '/find', params: { kind: 'event' } }} style={styles.link}>
            <ThemedText type="bodyStrong" themeColor="link">
              Browse events →
            </ThemedText>
          </Link>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  column: { maxWidth: 560, alignItems: 'center', gap: Spacing.three },
  logo: { width: 56, height: 56, marginBottom: Spacing.two },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: Spacing.four, marginTop: Spacing.two },
  link: { paddingVertical: Spacing.two },
});
