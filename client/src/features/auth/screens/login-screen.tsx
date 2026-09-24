import { Link, Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session';
import { useTheme } from '@/hooks/use-theme';
import { errorMessage, supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { Loading } from '@/ui/loading';
import { Screen } from '@/ui/screen';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// Sign in and sign up are the same flow (D-020): we email a 6-digit code, the user types it in.
export default function LoginScreen() {
  const theme = useTheme();
  const { session, org, isLoading } = useSession();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (session && isLoading) return <Loading />;
  if (session && org) return <Redirect href="/find" />;
  if (session) return <Redirect href={{ pathname: '/onboarding', params: role ? { role } : {} }} />;

  const sendCode = async () => {
    const address = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError('Enter a valid email address.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.signInWithOtp({ email: address });
    setBusy(false);
    if (error) return setError(errorMessage(error));
    setSentTo(address);
    setCode('');
  };

  const verify = async () => {
    if (!sentTo) return;
    if (!/^\d{6}$/.test(code.trim())) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: code.trim(), type: 'email' });
    setBusy(false);
    // On success the session changes and the redirects above take over.
    if (error) setError('That code is wrong or expired. Check the email or send a new code.');
  };

  return (
    <Screen title="Sign in" width="form">
      <Link href="/" style={styles.home}>
        <ThemedText type="smallStrong" themeColor="link">
          ← Maple home
        </ThemedText>
      </Link>
      <View style={styles.header}>
        <ThemedText type="title" level={1}>
          {sentTo ? 'Check your email' : 'Sign in to Maple'}
        </ThemedText>
        <ThemedText themeColor="textSecondary">
          {sentTo
            ? `We sent a 6-digit code to ${sentTo}.`
            : 'New here? The same code creates your account. No password needed.'}
        </ThemedText>
      </View>

      {sentTo ? (
        <>
          <TextField
            label="6-digit code"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            onSubmitEditing={verify}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
            error={error}
          />
          <Button title={busy ? 'Checking…' : 'Continue'} onPress={verify} disabled={busy} />
          <View style={styles.links}>
            <TextLink label="Send a new code" onPress={sendCode} color={theme.link} />
            <TextLink
              label="Use a different email"
              onPress={() => {
                setSentTo(null);
                setError(undefined);
              }}
              color={theme.link}
            />
          </View>
        </>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={sendCode}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            autoCapitalize="none"
            autoFocus
            error={error}
          />
          <Button title={busy ? 'Sending…' : 'Email me a code'} onPress={sendCode} disabled={busy} />
          <ThemedText type="small" themeColor="textSecondary">
            By continuing you agree to our{' '}
            <Link href="/legal/privacy" style={{ color: theme.link }}>
              privacy notice
            </Link>
            .
          </ThemedText>
        </>
      )}
    </Screen>
  );
}

function TextLink({ label, onPress, color }: { label: string; onPress: () => void; color: string }) {
  return (
    <Pressable role="button" onPress={onPress} hitSlop={8}>
      <ThemedText type="smallStrong" style={{ color }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  home: { alignSelf: 'flex-start' },
  header: { gap: Spacing.two, marginTop: Spacing.three },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.three },
});
