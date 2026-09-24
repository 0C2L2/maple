import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthPage, AuthSwitch, authMessage, TextButton } from '@/features/auth/components/auth-page';
import { EMAIL, PASSWORD_RULE, PasswordField, STRONG_PASSWORD } from '@/features/auth/components/password-field';
import { CAPTCHA, Turnstile } from '@/features/auth/components/turnstile';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// Forgot password: email, then a 6-digit code (not a link, so it works in the apps too), then a new password.
// Accounts that only ever used an email code or Google can set a first password here as well.
export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  // The code is checked once; a second try only retries the new password.
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const send = async () => {
    const address = email.trim().toLowerCase();
    if (!EMAIL.test(address)) return setError('Enter a valid email address.');
    if (CAPTCHA && !captcha) return setError('Wait for the security check above the button, then try again.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.resetPasswordForEmail(address, { captchaToken: captcha ?? undefined });
    setBusy(false);
    setCaptcha(null);
    setAttempt((n) => n + 1);
    if (error) return setError(authMessage(error));
    setSentTo(address);
  };

  const save = async () => {
    if (!sentTo) return;
    if (!verified && !/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
    if (!STRONG_PASSWORD.test(password)) return setError(PASSWORD_RULE);
    setBusy(true);
    setError(undefined);
    if (!verified) {
      const { error } = await supabase.auth.verifyOtp({ email: sentTo, token: code, type: 'recovery' });
      if (error) {
        setBusy(false);
        return setError('That code is wrong or expired. Check the email or send a new code.');
      }
      setVerified(true);
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authMessage(error));
    // Signed in now; /login moves them on to Find, or to onboarding if they have no page yet.
    router.replace('/login');
  };

  if (sentTo)
    return (
      <AuthPage
        title="Choose a new password"
        subtitle={`If ${sentTo} has a Maple account, we sent it a 6-digit code. Enter it with your new password.`}>
        {!verified && (
          <TextField
            label="6-digit code"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            autoFocus
          />
        )}
        <PasswordField
          label="New password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={save}
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <ThemedText type="small" themeColor="textSecondary">
          {PASSWORD_RULE}
        </ThemedText>
        <Button title={busy ? 'Saving…' : 'Save password and sign in'} onPress={save} disabled={busy} />
        {error && (
          <ThemedText role="alert" themeColor="danger">
            {error}
          </ThemedText>
        )}
        {!verified && (
          <View style={styles.links}>
            <TextButton
              label="Send a new code"
              onPress={() => {
                setSentTo(null);
                setError(undefined);
              }}
            />
          </View>
        )}
      </AuthPage>
    );

  return (
    <AuthPage
      title="Reset your password"
      subtitle="Enter the email you sign in with. We'll email you a 6-digit code."
      footer={<AuthSwitch lead="Remembered it?" label="Sign in" href="/login" />}>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        onSubmitEditing={send}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoFocus
      />
      <Turnstile key={attempt} onToken={setCaptcha} />
      <Button title={busy ? 'Sending…' : 'Email me a code'} onPress={send} disabled={busy} />
      {error && (
        <ThemedText role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </AuthPage>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', justifyContent: 'flex-start' },
});
