import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { AuthPage, AuthSwitch, authMessage, useSignedInRedirect } from '@/features/auth/components/auth-page';
import { ConfirmEmail } from '@/features/auth/components/confirm-email';
import { EMAIL, PASSWORD_RULE, PasswordField, STRONG_PASSWORD } from '@/features/auth/components/password-field';
import { CAPTCHA, Turnstile } from '@/features/auth/components/turnstile';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import { Button } from '@/ui/button';
import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

type Errors = { email?: string; password?: string; form?: string };

// Create an account with email and password, confirmed by a 6-digit code (D-030). Then onboarding creates
// the organization page (and records the Terms acceptance).
export default function SignupScreen() {
  const theme = useTheme();
  const { role } = useLocalSearchParams<{ role?: string }>();
  const redirect = useSignedInRedirect(role);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const signIn = { pathname: '/login', params: role ? { role } : {} } as const;
  if (redirect) return redirect;
  if (sentTo)
    return (
      // Supabase doesn't say whether an email already has an account (so nobody can probe for them), and
      // sends no code in that case. Hence the "Sign in" link here too.
      <AuthPage
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${sentTo}. Enter it to finish creating your account.`}
        footer={<AuthSwitch lead="Already have an account?" label="Sign in" href={signIn} />}>
        <ConfirmEmail email={sentTo} onBack={() => setSentTo(null)} />
      </AuthPage>
    );

  const create = async () => {
    const address = email.trim().toLowerCase();
    const next: Errors = {
      email: EMAIL.test(address) ? undefined : 'Enter a valid email address.',
      password: STRONG_PASSWORD.test(password) ? undefined : PASSWORD_RULE,
      form: CAPTCHA && !captcha ? 'Wait for the security check above the button, then try again.' : undefined,
    };
    setErrors(next);
    if (next.email || next.password || next.form) return;
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: address,
      password,
      options: { captchaToken: captcha ?? undefined },
    });
    setBusy(false);
    setCaptcha(null);
    setAttempt((n) => n + 1);
    if (error) return setErrors({ form: authMessage(error) });
    setSentTo(address);
  };

  return (
    <AuthPage
      title="Create your Maple account"
      subtitle="Free during early access. Your account runs your organization's page."
      footer={<AuthSwitch lead="Already have an account?" label="Sign in" href={signIn} />}>
      <TextField
        label="Work email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        autoCapitalize="none"
        autoFocus
        error={errors.email}
      />
      <PasswordField
        value={password}
        onChangeText={setPassword}
        onSubmitEditing={create}
        autoComplete="new-password"
        textContentType="newPassword"
        error={errors.password}
      />
      {!errors.password && (
        <ThemedText type="small" themeColor="textSecondary">
          {PASSWORD_RULE}
        </ThemedText>
      )}
      <Turnstile key={attempt} onToken={setCaptcha} />
      <Button title={busy ? 'Creating account…' : 'Create account'} onPress={create} disabled={busy} />
      {errors.form && (
        <ThemedText role="alert" themeColor="danger">
          {errors.form}
        </ThemedText>
      )}
      <ThemedText type="small" themeColor="textSecondary">
        By creating an account you agree to our{' '}
        <Link href="/legal/terms" style={{ color: theme.link }}>
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/legal/privacy" style={{ color: theme.link }}>
          privacy notice
        </Link>
        .
      </ThemedText>
    </AuthPage>
  );
}
