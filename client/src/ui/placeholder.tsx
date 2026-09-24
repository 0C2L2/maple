import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';
import { ThemedView } from '@/ui/themed-view';
import { ReadingWidth, Spacing } from '@/constants/theme';

type Props = { title: string; stage: number; children: string };

// Stand-in for a screen that isn't built yet. `stage` is the Build Plan stage that builds it
// (docs/engineering/BUILD_PLAN.md). Every page and its status: docs/engineering/PAGES.md.
export function Placeholder({ title, stage, children }: Props) {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <PageMeta title={title} />
      <View style={styles.inner}>
        <ThemedText type="title" level={1}>
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{children}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Built in Build Plan stage {stage}.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  inner: {
    maxWidth: ReadingWidth,
    gap: Spacing.two,
  },
});
