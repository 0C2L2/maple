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

// Free during early access; the planned fees (D-029, docs/business/MONETIZATION.md) start when payments launch.
const SECTIONS = [
  {
    title: 'What stays free',
    body: 'Posting, browsing, messaging, and reviews stay free for everyone. Sponsors never pay, and always send proposals free.',
  },
  {
    title: 'Planned fees, once payments launch',
    body: [
      'A fee on cash deals paid through Maple: 8% of the deal, taken from the organizer’s payout. Sponsors pay the package price and nothing more. For the first 6 months it’s 5%, pilot events pay 0%, and the minimum fee is ₩10,000. In-kind deals, like food, cloud credits, mentors, or a venue, are free.',
      'Extra proposals for organizers: each event gets 3 free proposals to sponsors, then ₩5,000 each, or 10 for ₩39,000. If a sponsor doesn’t reply within 14 days, the proposal is free again.',
    ],
  },
  {
    title: 'How paying through Maple will work',
    body: 'The sponsor pays Maple. We hold the money and pay the organizer after the event, once the results report is in. Organizers know they’ll be paid, and sponsors pay for an event that happened.',
  },
  {
    title: 'Our promise',
    body: 'We’ll tell you 60 days before any fee starts, and fees never apply to deals already marked Won.',
  },
];

/** /pricing (D-019): free during early access. */
export default function PricingScreen() {
  const { session } = useSession();
  return (
    <SitePage
      title="Pricing"
      description="Maple is free during early access. Later, organizers pay a fee only on cash deals paid through Maple and on extra proposals. Sponsors never pay."
      path="/pricing"
      lead="Maple is free during early access. Later, organizers pay only when a cash deal is paid through Maple. Sponsors never pay.">
      <Card>
        <View style={styles.planHead}>
          <ThemedText type="heading" level={2}>
            Free during early access
          </ThemedText>
          <ThemedText type="title">₩0</ThemedText>
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
