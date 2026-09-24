import { Image } from 'expo-image';
import { StyleSheet, View, type DimensionValue } from 'react-native';

import { CATEGORY_LABELS } from '@/constants/taxonomy';
import { Spacing } from '@/constants/theme';
import type { Showcase } from '@/features/showcase/queries';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/format';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

/** "Sep 24 – Sep 25, 2026" (or one date). */
export const dateRange = (start: string | null, end: string | null) =>
  !start ? null : end && end !== start ? `${formatDate(start)} – ${formatDate(end)}` : formatDate(start);

/** Event type · dates · city, for a showcase. */
export const showcaseMeta = (s: Showcase) =>
  [s.categories.map((c) => CATEGORY_LABELS[c]).join(', '), dateRange(s.starts_on, s.ends_on), s.city]
    .filter(Boolean)
    .join(' · ');

// A past event in a grid or carousel: cover, title, organizer, summary, two key numbers.
export function ShowcaseCard({ showcase: s, width }: { showcase: Showcase; width?: DimensionValue }) {
  const theme = useTheme();
  return (
    <View style={width ? { width } : styles.fill}>
      <Card href={`/showcase/${s.id}`} style={styles.card}>
        {s.cover_url ? (
          <Image source={s.cover_url} style={styles.cover} contentFit="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View style={[styles.cover, { backgroundColor: theme.backgroundSelected }]} />
        )}
        <View style={styles.body}>
          <ThemedText type="caption" themeColor="link">
            {showcaseMeta(s).toUpperCase()}
          </ThemedText>
          <ThemedText type="subheading" numberOfLines={2}>
            {s.title}
          </ThemedText>
          <ThemedText type="small">{s.org.name}</ThemedText>
          {s.summary ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>
              {s.summary}
            </ThemedText>
          ) : null}
          {s.facts.length > 0 && (
            <ThemedText type="smallStrong">
              {s.facts
                .slice(0, 2)
                .map((f) => `${f.label}: ${f.value}`)
                .join(' · ')}
            </ThemedText>
          )}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flexGrow: 1, flexBasis: 300, maxWidth: 520 },
  card: { padding: 0, gap: 0, overflow: 'hidden' },
  // Fixed height so the image stays a banner when the card is wide (a single card fills its row).
  cover: { width: '100%', height: 200 },
  body: { padding: Spacing.three, gap: Spacing.one },
});
