import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { SitePage, TextSection } from '@/features/site/components/site-page';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

const FREE = [
  'Your organization page',
  'Event posts and sponsor posts, with priced tiers',
  'Search and filters, including Best matches',
  'Sending and receiving proposals',
  'Private messages',
  'Reviews after completed deals',
];

// Free during early access (docs/business/MONETIZATION.md, Stage 0). No prices until paid plans launch (D-011).
const SECTIONS = [
  { title: 'What stays free', body: 'Posting, messaging, and reviews stay free.' },
  {
    title: 'What’s coming',
    body: [
      'Optional extras for organizations that want more reach: Premium, with more proposals and insights on who viewed your posts, and Boost, labeled priority in search.',
      'We’ll publish prices here before anything launches.',
    ],
  },
  {
    title: 'Our promise',
    body: 'If we add paid services, like getting paid through Maple, we’ll tell you 60 days ahead, and they’ll never apply to deals you’ve already made.',
  },
  {
    title: 'Does Maple take a cut of deals?',
    body: 'No. Maple doesn’t handle payments today, and there’s no fee on your deals.',
  },
];

/** /pricing (D-019): free during early access. */
export default function PricingScreen() {
  const { session } = useSession();
  return (
    <SitePage
      title="Pricing"
      description="Maple is free during early access: posting, proposals, messaging, and reviews."
      path="/pricing"
      lead="Maple is free during early access.">
      <Card>
        <View style={styles.planHead}>
          <ThemedText type="heading" level={2}>
            Free
          </ThemedText>
          <ThemedText type="title">$0</ThemedText>
        </View>
        {FREE.map((item) => (
          <ThemedText key={item}>✓ {item}</ThemedText>
        ))}
        <Button
          title={session ? 'Open Maple' : 'Join free'}
          onPress={() => router.push(session ? '/find' : '/signup')}
        />
      </Card>
      {SECTIONS.map((section) => (
        <TextSection key={section.title} {...section} />
      ))}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: Spacing.two },
});
