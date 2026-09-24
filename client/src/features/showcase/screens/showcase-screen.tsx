import { Image } from 'expo-image';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { OrgLogo } from '@/features/organizations/components/org-logo';
import { ShowcaseCard, showcaseMeta } from '@/features/showcase/components/showcase-card';
import { useShowcase, useShowcases } from '@/features/showcase/queries';
import { SitePage, TextSection } from '@/features/site/components/site-page';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { Loading } from '@/ui/loading';
import { Notice } from '@/ui/notice';
import { Screen } from '@/ui/screen';
import { ThemedText } from '@/ui/themed-text';

/** /showcase/[id]: one past event, laid out like a Wishket portfolio page. */
export default function ShowcaseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { data: s, isPending } = useShowcase(id);
  const { data: all } = useShowcases();

  if (isPending) return <Loading />;
  if (!s)
    return (
      <Screen title="Showcase not found">
        <Notice title="Showcase not found" action={{ title: 'All showcases', href: '/showcase' }} />
      </Screen>
    );
  const related = (all ?? []).filter((other) => other.id !== s.id).slice(0, 3);

  return (
    <SitePage title={s.title} description={s.summary || s.title} path={`/showcase/${s.id}`} lead={s.summary}>
      <ThemedText type="caption" themeColor="link">
        {showcaseMeta(s).toUpperCase()}
      </ThemedText>
      <Link href={`/org/${s.org.handle}`}>
        <View style={styles.org}>
          <OrgLogo name={s.org.name} url={s.org.logo_url} size={40} />
          <View>
            <ThemedText type="bodyStrong">{s.org.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Organizer
            </ThemedText>
          </View>
        </View>
      </Link>

      {s.cover_url && <Image source={s.cover_url} style={styles.cover} contentFit="cover" />}

      {s.facts.length > 0 && (
        <View style={styles.facts}>
          {s.facts.map((f) => (
            <View key={f.label} style={[styles.fact, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="heading">{f.value}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {f.label}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {s.highlights.length > 0 && <TextSection title="Highlights" body={s.highlights.map((h) => `• ${h}`)} />}
      {s.body ? <TextSection title="About the event" body={s.body.split('\n\n')} /> : null}
      {s.venue && <TextSection title="Where" body={s.venue} />}
      {s.sponsors.length > 0 && <TextSection title="Sponsors" body={s.sponsors.join(' · ')} />}

      {s.gallery.length > 0 && (
        <View style={styles.gallery}>
          {s.gallery.map((url) => (
            <Image key={url} source={url} style={styles.photo} contentFit="cover" />
          ))}
        </View>
      )}

      <View style={styles.actions}>
        <Button title="Post your event free" onPress={() => router.push('/posts/new')} />
        <Button title={`See ${s.org.name}`} variant="secondary" onPress={() => router.push(`/org/${s.org.handle}`)} />
        {s.link && <Button title="Original event page" variant="secondary" onPress={() => Linking.openURL(s.link!)} />}
      </View>

      {related.length > 0 && (
        <Card style={styles.related}>
          <ThemedText type="heading" level={2}>
            More showcases
          </ThemedText>
          <View style={styles.relatedRow}>
            {related.map((r) => (
              <ShowcaseCard key={r.id} showcase={r} />
            ))}
          </View>
        </Card>
      )}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  org: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cover: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  fact: { flexGrow: 1, flexBasis: 140, borderRadius: 12, padding: Spacing.three, gap: Spacing.half },
  gallery: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  photo: { flexGrow: 1, flexBasis: 240, aspectRatio: 4 / 3, borderRadius: 12 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  related: { gap: Spacing.three },
  relatedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
