import { LegalPage } from '@/features/site/components/site-page';

const SECTIONS = [
  {
    title: 'Be a real organization',
    body: 'Create a page only for an organization you represent. Use its real name, logo, and website. Don’t pretend to be another organization.',
  },
  {
    title: 'Post real opportunities',
    body: 'Event posts are for real events you run; sponsor posts are for real budgets. Keep dates, attendance, and budgets accurate, and close posts that are no longer open.',
  },
  {
    title: 'Send proposals that fit',
    body: 'Read the post first and say why it fits. Don’t send the same copy-pasted proposal to every post.',
  },
  {
    title: 'Be respectful',
    body: 'No harassment, hate, threats, or discrimination. Keep messages professional.',
  },
  {
    title: 'No scams or spam',
    body: 'Don’t ask for payment before the other side can check who you are, don’t ask for passwords, don’t share harmful links, and don’t advertise things unrelated to sponsorship.',
  },
  {
    title: 'Honest reviews',
    body: 'Review only deals you took part in, and describe what really happened. No trading reviews and no revenge reviews.',
  },
  {
    title: 'Keep private things private',
    body: 'Don’t publish other organizations’ messages, proposals, or personal details.',
  },
  {
    title: 'Legal sponsorship only',
    body: 'No events or sponsorships of illegal products or services, and no adult content.',
  },
  {
    title: 'When someone breaks the rules',
    body: 'Use Report on the post, organization page, or review, or block the organization. Maple staff review every report and may remove content or suspend or delete accounts. Serious or repeated breaks lead to removal.',
  },
];

/** /legal/community */
export default function CommunityScreen() {
  return (
    <LegalPage
      title="Community guidelines"
      description="How organizations behave on Maple: real organizations, real opportunities, honest reviews."
      path="/legal/community"
      updated="25 September 2026"
      sections={SECTIONS}
    />
  );
}
