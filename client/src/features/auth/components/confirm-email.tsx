import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { authMessage, TextButton } from '@/features/auth/components/auth-page';
import { CAPTCHA, Turnstile } from '@/features/auth/components/turnstile';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

// The last step of signing up: the 6-digit code from the confirmation email. Signing in with an email that
// was never confirmed lands here too. A correct code signs the user in, and the page's redirect takes over.
export function ConfirmEmail({ email, onBack }: { email: string; onBack: () => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [busy, setBusy] = useState(false);
  // "Send a new code" first shows the security check; its token sends the email.
  const [checking, setChecking] = useState(false);

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from the email.');
    setBusy(true);
    setError(undefined);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    setBusy(false);
    if (error) setError('That code is wrong or expired. Check the email or send a new code.');
  };

  const resend = async (captchaToken?: string) => {
    setChecking(false);
    setError(undefined);
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { captchaToken } });
    if (error) setError(authMessage(error));
    else setNotice(`We sent a new code to ${email}.`);
  };

  return (
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
      <Button title={busy ? 'Checking…' : 'Confirm email'} onPress={verify} disabled={busy} />
      {notice && (
        <ThemedText role="status" type="small" themeColor="textSecondary">
          {notice}
        </ThemedText>
      )}
      {checking && <Turnstile onToken={(token) => token && resend(token)} />}
      <View style={styles.links}>
        <TextButton label="Send a new code" onPress={() => (CAPTCHA ? setChecking(true) : resend())} />
        <TextButton label="Use a different email" onPress={onBack} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.three },
});
