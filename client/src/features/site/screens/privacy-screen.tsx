import { CONTACT_EMAIL } from '@/constants/site';
import { LegalPage } from '@/features/site/components/site-page';

// ponytail: a plain-language notice for v1. Have a lawyer review it before paid plans launch (v1.1).
const SECTIONS = [
  {
    title: 'Who we are',
    body: `Maple (mapleapp.tech) is a sponsorship marketplace for event organizers and sponsors. You can reach us at ${CONTACT_EMAIL}.`,
  },
  {
    title: 'What we collect',
    body: [
      'Your email address, to sign you in with a one-time code.',
      'Your organization page: name, page address, logo, banner, tagline, city, about, website, and the event types, regions, audience, and budget you choose, plus when you accepted the Terms. Maple accounts are organizations; the person who signs in is never shown.',
      'What you create on Maple: posts and their tiers, proposals, reviews, follows, saved posts, messages, reports you send, and organizations you block.',
      'Basic usage events (for example "searched" or "sent a proposal"), linked to your account, so we can see which features work.',
    ],
  },
  {
    title: 'Who can see it',
    body: 'Your organization page, posts, reviews, and follows are public, including to people who are not signed in. Proposals and messages are private to the organizations in that conversation. Reports are private to you and Maple staff. Notifications, blocks, and your email address are private to you.',
  },
  {
    title: 'Why we use it',
    body: 'To run Maple: show your organization page, deliver proposals and messages, send sign-in codes, keep Maple safe, and improve the product. We do not sell your data and we do not show ads.',
  },
  {
    title: 'Where it is stored',
    body: 'Supabase stores the database and handles sign-in. Cloudflare serves the website. Resend sends sign-in emails. PostHog stores usage events. We do not use advertising cookies.',
  },
  {
    title: 'How long we keep it',
    body: 'For as long as your account exists. When you delete your account, we delete your organization page and everything you created right away; copies in backups are gone within 30 days.',
  },
  {
    title: 'Your choices',
    body: `You can edit your organization page or delete your account at any time in Settings. To see or export your data, email ${CONTACT_EMAIL}.`,
  },
  {
    title: 'Changes',
    body: 'If we change this notice, we will update this page and tell you in the app.',
  },
];

/** /legal/privacy */
export default function PrivacyScreen() {
  return (
    <LegalPage
      title="Privacy notice"
      description="What Maple collects, who can see it, and your choices."
      path="/legal/privacy"
      updated="25 September 2026"
      sections={SECTIONS}
    />
  );
}
