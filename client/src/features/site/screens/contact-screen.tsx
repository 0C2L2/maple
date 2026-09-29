import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { CONTACT_TOPICS } from '@/constants/site';
import { EMAIL } from '@/features/auth/components/password-field';
import { useSession } from '@/features/auth/session';
import { SitePage } from '@/features/site/components/site-page';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Card } from '@/ui/card';
import { ChoiceChips } from '@/ui/choice-chips';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

/** /contact: a message form (optionally /contact?topic=intro). Messages land in the staff inbox on /admin. */
export default function ContactScreen() {
  const { session } = useSession();
  const params = useLocalSearchParams<{ topic?: string }>();
  const [topic, setTopic] = useState(CONTACT_TOPICS.some((t) => t.value === params.topic) ? params.topic! : null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(session?.user.email ?? '');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const send = async () => {
    if (!topic) return setError('Pick a topic.');
    if (!name.trim()) return setError('Enter your name.');
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.');
    if (!message.trim()) return setError('Write a message.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.rpc('send_contact_message', { topic, name, email, message, website });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    setSentTo(email.trim());
    setMessage('');
  };

  return (
    <SitePage
      title="Contact us"
      description="Questions, partnerships, press, or privacy requests: send Maple a message."
      path="/contact"
      image={require('@/assets/images/site/talk.webp')}
      imageAlt="A team talking over a laptop"
      lead="Send us a message. We read every one and reply by email as soon as we can.">
      {sentTo ? (
        <Card>
          <ThemedText type="subheading" level={2}>
            Message sent
          </ThemedText>
          <ThemedText themeColor="textSecondary">Thanks! We’ll reply to {sentTo} as soon as we can.</ThemedText>
          <Button title="Send another message" variant="secondary" onPress={() => setSentTo(null)} />
        </Card>
      ) : (
        <Card>
          <ChoiceChips label="Topic" options={CONTACT_TOPICS} value={topic} onChange={setTopic} />
          {topic === 'report' && (
            <ThemedText type="small" themeColor="textSecondary">
              To report a post, organization page, or review, use Report on that page. It reaches us fastest.
            </ThemedText>
          )}
          <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" maxLength={120} />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            maxLength={254}
          />
          <TextField
            label="Message"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={4000}
            style={styles.message}
          />
          {/* Honeypot: hidden from people; the database drops messages that fill it. */}
          <View aria-hidden style={styles.trap}>
            <TextInput
              value={website}
              onChangeText={setWebsite}
              tabIndex={-1}
              autoComplete="off"
              accessibilityLabel="Leave this field empty"
            />
          </View>
          {error && (
            <ThemedText role="alert" themeColor="danger">
              {error}
            </ThemedText>
          )}
          <Button title={busy ? 'Sending…' : 'Send message'} onPress={send} disabled={busy} />
        </Card>
      )}
    </SitePage>
  );
}

const styles = StyleSheet.create({
  message: { minHeight: 160, textAlignVertical: 'top' },
  trap: { position: 'absolute', left: -10000, width: 1, height: 1, overflow: 'hidden' },
});
