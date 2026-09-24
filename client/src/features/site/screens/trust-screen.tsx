import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { SitePage, TextSection } from '@/features/site/components/site-page';
import { Button } from '@/ui/button';

const SECTIONS = [
  {
    title: 'Every account is an organization',
    body: 'Each Maple account is an organization page with its own address, website, and history on Maple. The person who signs in stays private; the organization is public.',
  },
  {
    title: 'Reviews come from real deals',
    body: 'Only the two organizations in a completed deal can review each other: once each, after the event. Ratings on organization pages count only these reviews, so they can’t be bought or traded.',
  },
  {
    title: 'Paid visibility is always labeled',
    body: 'When Boost launches, boosted posts will always show a “Boosted” label, appear at most twice in every 10 results, and only when they match your search.',
  },
  {
    title: 'Report and block',
    body: [
      'Every post, organization page, and review has a Report link. Maple staff review reports and remove content that breaks the Community guidelines.',
      'Block an organization from its page to stop messages and proposals between you, both ways.',
    ],
  },
  {
    title: 'Staying safe with payments',
    body: [
      'Maple doesn’t handle sponsorship payments yet, so you pay and get paid directly. Before you do:',
      '• Check the organization’s page, reviews, and website.',
      '• Put the deal in writing: the amount, what each side delivers, and the dates.',
      '• Be careful with anyone who asks for payment before you can check who they are.',
      '• Maple will never ask for your password or card details in a message.',
    ],
  },
  {
    title: 'Your data',
    body: 'We don’t sell your data and we don’t show ads. Proposals and messages are private to the organizations in them. The privacy notice has the details.',
  },
];

/** /trust: how Maple keeps sponsorship deals honest, and safety tips. */
export default function TrustScreen() {
  return (
    <SitePage
      title="Trust and safety"
      description="How Maple keeps sponsorship deals honest: organization accounts, reviews from real deals, labeled Boosts, report and block."
      path="/trust"
      image={require('@/assets/images/site/sponsor.webp')}
      imageAlt="Two people shaking hands"
      lead="How Maple keeps sponsorship deals honest, and how you can stay safe.">
      {SECTIONS.map((section) => (
        <TextSection key={section.title} {...section} />
      ))}
      <View style={styles.actions}>
        <Button title="Community guidelines" onPress={() => router.push('/legal/community')} />
        <Button title="Privacy notice" variant="secondary" onPress={() => router.push('/legal/privacy')} />
        <Button title="Contact us" variant="secondary" onPress={() => router.push('/contact')} />
      </View>
    </SitePage>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
