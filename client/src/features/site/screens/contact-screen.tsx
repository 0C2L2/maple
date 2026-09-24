import { Linking } from 'react-native';

import { CONTACT_EMAIL } from '@/constants/site';
import { SitePage } from '@/features/site/components/site-page';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ThemedText } from '@/ui/themed-text';

// ponytail: one inbox with a subject per topic; add a contact form (or more addresses) when volume needs it.
const TOPICS = [
  { title: 'Help with your account', body: 'Signing in, your organization page, posts, or proposals.', subject: 'Support' },
  {
    title: 'Partnerships',
    body: 'Sponsorship programs, event networks, and communities that want to work with Maple.',
    subject: 'Partnership',
  },
  { title: 'Press', body: 'Stories, interviews, and media requests.', subject: 'Press' },
  {
    title: 'Report a problem',
    body: 'Use Report on any post, organization page, or review. For anything urgent, email us.',
    subject: 'Report',
  },
  { title: 'Privacy requests', body: 'See, export, or delete your data.', subject: 'Privacy request' },
];

/** /contact: one email address, with a subject for each topic. */
export default function ContactScreen() {
  return (
    <SitePage
      title="Contact us"
      description={`Questions, partnerships, press, or privacy requests: email ${CONTACT_EMAIL}.`}
      path="/contact"
      image={require('@/assets/images/site/talk.webp')}
      imageAlt="A team talking over a laptop"
      lead={`Email ${CONTACT_EMAIL}. We read every message and reply as soon as we can.`}>
      {TOPICS.map((topic) => (
        <Card key={topic.title}>
          <ThemedText type="subheading" level={2}>
            {topic.title}
          </ThemedText>
          <ThemedText themeColor="textSecondary">{topic.body}</ThemedText>
          <Button
            title="Email us"
            variant="secondary"
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic.subject)}`)}
          />
        </Card>
      ))}
    </SitePage>
  );
}
