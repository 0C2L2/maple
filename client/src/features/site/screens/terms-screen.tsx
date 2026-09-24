import { CONTACT_EMAIL } from '@/constants/site';
import { LegalPage } from '@/features/site/components/site-page';

// ponytail: plain-language v1. Before paid plans launch, a lawyer reviews it and adds the company's legal name
// and governing law.
const SECTIONS = [
  {
    title: 'About these terms',
    body: 'These terms are an agreement between your organization and Maple (mapleapp.tech). By creating an organization page you accept them and the Community guidelines. If you don’t agree, don’t use Maple.',
  },
  {
    title: 'Your organization account',
    body: 'Maple accounts are for organizations. You must be allowed to act for the organization you create, give accurate information, and keep your sign-in email secure. You’re responsible for what happens in your account.',
  },
  {
    title: 'Your content',
    body: 'You own what you post: your page, posts, proposals, messages, and reviews. You let Maple host and show it as needed to run Maple, for example showing your public posts to visitors. Only post what you have the right to, including logos.',
  },
  {
    title: 'Deals between organizations',
    body: 'Maple helps organizations find each other. Sponsorship deals are made directly between the organizations: Maple is not a party to them, doesn’t handle payments today, and doesn’t guarantee any organization, event, audience size, or result. Check who you deal with and put agreements in writing.',
  },
  {
    title: 'Reviews',
    body: 'Reviews must be honest and about a real, completed deal. Don’t offer or accept anything in exchange for a review.',
  },
  {
    title: 'Fees',
    body: 'Maple is free during early access. We may add paid services later, such as Premium plans, Boost, or payments through Maple. We’ll tell you at least 60 days before a new fee applies to you, and new fees never apply to deals already made.',
  },
  {
    title: 'What’s not allowed',
    body: 'Breaking the Community guidelines, the law, or other people’s rights; pretending to be another organization; collecting data from Maple with bots or scrapers; and trying to break or overload Maple.',
  },
  {
    title: 'Removing content and accounts',
    body: 'You can delete your account at any time in Settings. We may remove content, or suspend or delete accounts, that break these terms or the Community guidelines.',
  },
  {
    title: 'No guarantees',
    body: 'Maple is provided as it is. We work to keep it running, but we can’t promise it will always be available or free of errors. As far as the law allows, Maple isn’t responsible for indirect losses, or for deals, events, or payments between organizations.',
  },
  {
    title: 'Changes',
    body: 'We may update these terms. We’ll post the new version here and tell you in the app before important changes take effect.',
  },
  { title: 'Contact', body: `Questions about these terms: ${CONTACT_EMAIL}.` },
];

/** /legal/terms */
export default function TermsScreen() {
  return (
    <LegalPage
      title="Terms of service"
      description="The rules for using Maple, the sponsorship marketplace for organizations."
      path="/legal/terms"
      updated="25 September 2026"
      sections={SECTIONS}
    />
  );
}
