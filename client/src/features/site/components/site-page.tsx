import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { MaxContentWidth, ReadingWidth, Spacing } from '@/constants/theme';
import { SiteFooter } from '@/features/site/components/site-footer';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

type Props = {
  title: string;
  description: string;
  /** Canonical path, e.g. /about. */
  path: string;
  lead?: string;
  wide?: boolean;
  /** A photo beside the title (a require()'d file from assets/images/site). */
  image?: number;
  imageAlt?: string;
  children: ReactNode;
};

// A public website page (About, How it works, legal…): a tinted header band with the title, lead, and an
// optional photo, then the content column and the footer.
export function SitePage({ title, description, path, lead, wide, image, imageAlt, children }: Props) {
  const theme = useTheme();
  const split = useIsWide(900) && image != null;
  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <Stack.Screen options={{ title }} />
      <PageMeta title={title} description={description} path={path} />
      <View style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.headerInner, { maxWidth: image || wide ? MaxContentWidth : ReadingWidth }, split && styles.row]}>
          <View {...motion({ enter: 0 })} style={[styles.headerText, split && styles.fill]}>
            <ThemedText type="display" level={1}>
              {title}
            </ThemedText>
            {lead && (
              <ThemedText type="lead" themeColor="textSecondary">
                {lead}
              </ThemedText>
            )}
          </View>
          {image != null && (
            <View {...motion({ enter: 2 })} style={[styles.art, split && styles.artWide]}>
              <Image source={image} accessibilityLabel={imageAlt} style={styles.photo} contentFit="cover" />
            </View>
          )}
        </View>
      </View>
      <View style={[styles.body, { maxWidth: wide ? MaxContentWidth : ReadingWidth }]}>{children}</View>
      <SiteFooter />
    </ScrollView>
  );
}

/** A heading followed by paragraphs. Pass several strings for several paragraphs. Rises in on scroll (web). */
export function TextSection({ title, body }: { title: string; body: string | string[] }) {
  return (
    <View {...motion({ reveal: '' })} style={styles.section}>
      <ThemedText type="heading" level={2}>
        {title}
      </ThemedText>
      {(Array.isArray(body) ? body : [body]).map((paragraph) => (
        <ThemedText key={paragraph}>{paragraph}</ThemedText>
      ))}
    </View>
  );
}

type LegalProps = Omit<Props, 'children' | 'lead' | 'wide' | 'image' | 'imageAlt'> & {
  updated: string;
  sections: { title: string; body: string | string[] }[];
};

// Privacy notice, Terms, Community guidelines.
export function LegalPage({ updated, sections, ...page }: LegalProps) {
  return (
    <SitePage {...page} lead={`Last updated ${updated}`}>
      {sections.map((section) => (
        <TextSection key={section.title} {...section} />
      ))}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  fill: { flex: 1 },
  header: { paddingHorizontal: Spacing.four, paddingVertical: Spacing.six },
  headerInner: { width: '100%', alignSelf: 'center', gap: Spacing.five },
  headerText: { gap: Spacing.three },
  art: { height: 240, borderRadius: 24, overflow: 'hidden' },
  artWide: { flex: 1, height: 340 },
  photo: { width: '100%', height: '100%' },
  body: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    gap: Spacing.five,
  },
  section: { gap: Spacing.two },
});
