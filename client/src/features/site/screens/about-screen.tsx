import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { SitePage, TextSection } from '@/features/site/components/site-page';
import { Button } from '@/ui/button';

// ponytail: no founder names or photos yet; add a "Who we are" section when they're ready.
const SECTIONS = [
  {
    title: 'Why Maple exists',
    body: [
      'Organizers spend weeks sending cold emails and decks that nobody answers. Sponsors get flooded with generic requests and still can’t find the events their audience goes to.',
      'Sponsorship mostly runs on spreadsheets, cold email, and who you know. Maple gives it a real marketplace.',
    ],
  },
  {
    title: 'What Maple does',
    body: 'Organizers post their event: the plan, the audience, and what sponsors get. Sponsors post what they back: budget, event types, and what they give. The other side sends proposals, both sides talk in private messages, and after the event they review each other.',
  },
  {
    title: 'What we believe',
    body: [
      'Organizations, not personal profiles. Every account is an organization page.',
      'Reviews come only from real, completed deals.',
      'Paid visibility is always labeled.',
      'We don’t sell your data, and we don’t show ads.',
    ],
  },
  {
    title: 'Where we are',
    body: 'Maple is in early access. We’re starting with tech events, hackathons, and developer meetups, and building Maple with the first organizers and sponsors who use it. Tell us what you need.',
  },
];

/** /about: why Maple exists and what it stands for. */
export default function AboutScreen() {
  return (
    <SitePage
      title="About Maple"
      description="Maple is the sponsorship marketplace for event organizers and the companies that sponsor them."
      path="/about"
      image={require('@/assets/images/site/conference.webp')}
      imageAlt="A full conference audience"
      lead="Maple is the sponsorship marketplace for event organizers and the companies that sponsor them.">
      {SECTIONS.map((section) => (
        <TextSection key={section.title} {...section} />
      ))}
      <View style={styles.actions}>
        <Button title="Contact us" onPress={() => router.push('/contact')} />
        <Button title="How it works" variant="secondary" onPress={() => router.push('/how-it-works')} />
      </View>
    </SitePage>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
});
