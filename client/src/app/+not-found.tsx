import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';
import { ThemedView } from '@/ui/themed-view';
import { Spacing } from '@/constants/theme';

export default function NotFound() {
  return (
    <ThemedView style={styles.container}>
      <PageMeta title="Page not found" />
      <ThemedText type="title" level={1}>
        This page doesn&apos;t exist.
      </ThemedText>
      <Link href="/">
        <ThemedText themeColor="link">Go to the home page</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
