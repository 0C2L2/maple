import { ScrollView, StyleSheet, View } from 'react-native';

import { CONTACT_EMAIL } from '@/constants/site';
import { ReadingWidth, Spacing } from '@/constants/theme';
import { SiteFooter } from '@/features/site/components/site-footer';
import { useTheme } from '@/hooks/use-theme';
import { PageMeta } from '@/ui/page-meta';
import { ThemedText } from '@/ui/themed-text';

// ponytail: a plain-language notice for v1. Have a lawyer review it before paid plans launch (v1.1).
const SECTIONS = [
  {
    title: 'Who we are',
    body: `Maple (mapleapp.tech) is a sponsorship marketplace for event organizers and sponsors. You can reach us at ${CONTACT_EMAIL}.`,
  },
  {
    title: 'What we collect',
    body: 'Your email address, to sign you in with a one-time code. Your organization page: name, page address, logo, banner, tagline, city, about, website, and the event types, regions, audience, and budget you choose. Maple accounts are organizations; the person who signs in is never shown. What you create on Maple: posts and their tiers, proposals, reviews, follows, saved posts, and messages. Basic usage events (for example "searched" or "sent a proposal"), linked to your account, so we can see which features work.',
  },
  {
    title: 'Who can see it',
    body: 'Your organization page, posts, reviews, and follows are public, including to people who are not signed in. Proposals and messages are private to the organizations in that conversation. Notifications and your email address are private to you.',
  },
  {
    title: 'Why we use it',
    body: 'To run Maple: show your organization page, deliver proposals and messages, send sign-in codes, and improve the product. We do not sell your data and we do not show ads.',
  },
  {
    title: 'Where it is stored',
    body: 'Supabase stores the database and handles sign-in. Cloudflare serves the website. Resend sends sign-in emails. PostHog stores usage events. We do not use advertising cookies.',
  },
  {
    title: 'How long we keep it',
    body: 'For as long as your account exists. When you ask us to delete your account, we delete your organization page and everything you created within 30 days.',
  },
  {
    title: 'Your choices',
    body: `You can edit your organization page at any time in Settings. To see, export, or delete your data, email ${CONTACT_EMAIL}.`,
  },
  {
    title: 'Changes',
    body: 'If we change this notice, we will update this page and tell you in the app.',
  },
];

export default function Privacy() {
  const theme = useTheme();
  return (
    <ScrollView style={{ backgroundColor: theme.background }}>
      <PageMeta title="Privacy notice" description="What Maple collects, who can see it, and your choices." path="/legal/privacy" />
      <View style={styles.body}>
        <ThemedText type="title" level={1}>
          Privacy notice
        </ThemedText>
        <ThemedText themeColor="textSecondary">Last updated 24 September 2026</ThemedText>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <ThemedText type="heading" level={2}>
              {section.title}
            </ThemedText>
            <ThemedText>{section.body}</ThemedText>
          </View>
        ))}
      </View>
      <SiteFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    width: '100%',
    maxWidth: ReadingWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.one,
  },
});
