import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { SitePage, TextSection } from '@/features/site/components/site-page';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { TabStrip } from '@/ui/tab-strip';
import { ThemedText } from '@/ui/themed-text';

type Side = 'organizers' | 'sponsors';

const SIDES = [
  { value: 'organizers' as const, label: 'For organizers' },
  { value: 'sponsors' as const, label: 'For sponsors' },
];

const STEPS: Record<Side, { title: string; body: string }[]> = {
  organizers: [
    {
      title: 'Create your organization page',
      body: 'Sign in with your email and set up your page: name, logo, the events you run, and your audience.',
    },
    {
      title: 'Post your event',
      body: 'Share the event plan, dates and place, expected attendance, the support you need, and what sponsors get. Add priced tiers, like Gold $5,000, if you have them.',
    },
    {
      title: 'Receive proposals',
      body: 'Sponsors send proposals with a message, a tier, and an amount. Each proposal opens a private conversation.',
    },
    {
      title: 'Pick your sponsors',
      body: 'Shortlist, talk, and mark the proposals you agree to as Won. You can also browse sponsor posts and propose to sponsors yourself.',
    },
    {
      title: 'Run the event',
      body: 'Agree the payment and what each sponsor gets directly with them, in writing. Maple doesn’t handle payments yet.',
    },
    {
      title: 'Complete and review',
      body: 'After the event, mark the deal Completed. Both sides leave a 1–5 star review that shows on each other’s page.',
    },
  ],
  sponsors: [
    {
      title: 'Create your organization page',
      body: 'Add your company, the events you sponsor, your regions, your budget per event, and what you give.',
    },
    {
      title: 'Find events, or post what you back',
      body: 'Browse event posts by type, region, and budget. Best matches ranks them by fit with your page. Or post what you back and let organizers come to you.',
    },
    {
      title: 'Send or receive proposals',
      body: 'Propose to an event with a tier and an amount, or compare the organizers who propose to your post.',
    },
    {
      title: 'Agree the deal',
      body: 'Talk in private messages. When you agree, the owner of the post marks the deal Won.',
    },
    {
      title: 'Pay and deliver',
      body: 'Agree the payment and what you get directly with the organizer, in writing. Maple doesn’t handle payments yet.',
    },
    {
      title: 'Complete and review',
      body: 'After the event, mark the deal Completed and review each other with 1–5 stars.',
    },
  ],
};

const STATUSES = [
  ['New', 'The proposal just arrived.'],
  ['Shortlisted', 'The owner of the post is interested.'],
  ['In talks', 'Both sides are working out the details in messages.'],
  ['Won', 'The deal is agreed.'],
  ['Declined', 'Not a fit this time.'],
  ['Completed', 'The event happened. Both sides can now review each other.'],
];

const FAQ = [
  {
    title: 'Does Maple take a cut of the deal?',
    body: 'No. Maple is free during early access and doesn’t handle payments. You agree the payment directly with the other organization.',
  },
  {
    title: 'Who sees my proposal?',
    body: 'Only you and the owner of the post. Proposals and messages are private.',
  },
  {
    title: 'Can individuals sign up?',
    body: 'No. Every account is an organization: an event organizer or a sponsoring company. The person who signs in stays private.',
  },
];

/** /how-it-works: the deal step by step, for each side of the market (?for=organizers|sponsors). */
export default function HowItWorksScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ for?: string }>();
  const side: Side = params.for === 'sponsors' ? 'sponsors' : 'organizers';
  const sponsor = side === 'sponsors';

  return (
    <SitePage
      title="How Maple works"
      description="Organizers post their event, sponsors post what they back, the other side sends proposals, and both sides review each other after the event."
      path="/how-it-works"
      image={require('@/assets/images/site/plan.webp')}
      imageAlt="Planning an event at a laptop"
      lead="Organizers post their event. Sponsors post what they back. The other side sends proposals, you pick, and after the event both sides review each other.">
      <TabStrip tabs={SIDES} value={side} onChange={(next) => router.setParams({ for: next })} />
      <View style={styles.steps}>
        {STEPS[side].map((step, i) => (
          <Card key={step.title}>
            <View style={styles.step}>
              <View style={[styles.number, { backgroundColor: theme.brand }]}>
                <ThemedText type="bodyStrong" style={{ color: theme.onBrand }}>
                  {i + 1}
                </ThemedText>
              </View>
              <View style={styles.stepText}>
                <ThemedText type="subheading" level={3}>
                  {step.title}
                </ThemedText>
                <ThemedText themeColor="textSecondary">{step.body}</ThemedText>
              </View>
            </View>
          </Card>
        ))}
      </View>
      <View style={styles.actions}>
        <Button
          title={sponsor ? 'Post as a sponsor' : 'Post your event'}
          onPress={() => router.push({ pathname: '/signup', params: { role: sponsor ? 'sponsor' : 'organizer' } })}
        />
        <Button
          title={sponsor ? 'Find events' : 'Find sponsors'}
          variant="secondary"
          onPress={() => router.push({ pathname: '/find', params: { kind: sponsor ? 'event' : 'sponsor' } })}
        />
      </View>

      <ThemedText type="heading" level={2}>
        Proposal statuses
      </ThemedText>
      <Card>
        {STATUSES.map(([name, meaning]) => (
          <ThemedText key={name}>
            <ThemedText type="bodyStrong">{name}: </ThemedText>
            {meaning}
          </ThemedText>
        ))}
      </Card>

      {FAQ.map((item) => (
        <TextSection key={item.title} {...item} />
      ))}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  steps: { gap: Spacing.three },
  step: { flexDirection: 'row', gap: Spacing.three },
  number: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepText: { flex: 1, gap: Spacing.one },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
