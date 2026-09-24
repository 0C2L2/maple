import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthPage, AuthSwitch, authMessage, useSignedInRedirect } from '@/features/auth/components/auth-page';
import { ConfirmEmail } from '@/features/auth/components/confirm-email';
import { EMAIL, PasswordField } from '@/features/auth/components/password-field';
import { CAPTCHA, Turnstile } from '@/features/auth/components/turnstile';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// Sign in with email and password (D-030). An account whose email was never confirmed finishes that step here.
export default function LoginScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const redirect = useSignedInRedirect(role);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);

  if (redirect) return redirect;
  if (unconfirmed)
    return (
      <AuthPage
        title="Confirm your email"
        subtitle={`Enter the 6-digit code we emailed to ${unconfirmed} when you signed up, or send a new one.`}>
        <ConfirmEmail email={unconfirmed} onBack={() => setUnconfirmed(null)} />
      </AuthPage>
    );

  const signIn = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address) || !password) return setError('Enter your email and password.');
    if (CAPTCHA && !captcha) return setError('Wait for the security check above the button, then try again.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.signInWithPassword({
      email: address,
      password,
      options: { captchaToken: captcha ?? undefined },
    });
    setBusy(false);
    setCaptcha(null);
    setAttempt((n) => n + 1);
    // On success the session changes and the redirect above takes over.
    if (!error) return;
    if (error.code === 'email_not_confirmed') return setUnconfirmed(address);
    setError(authMessage(error));
  };

  return (
    <AuthPage
      title="Sign in to Maple"
      footer={
        <AuthSwitch lead="New to Maple?" label="Create an account" href={{ pathname: '/signup', params: role ? { role } : {} }} />
      }>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoFocus
      />
      <PasswordField
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={signIn}
        autoComplete="current-password"
        textContentType="password"
      />
      <View style={styles.forgot}>
        <Link href="/reset-password">
          <ThemedText type="smallStrong" themeColor="link">
            Forgot password?
          </ThemedText>
        </Link>
      </View>
      <Turnstile key={attempt} onToken={setCaptcha} />
      <Button title={busy ? 'Signing in…' : 'Sign in'} onPress={signIn} disabled={busy} />
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end' },
});
