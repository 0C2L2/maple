import { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { getSupabaseClient } from '@/lib/supabase/client';
import { authErrorMessage } from '@/lib/supabase/errors';

const inputClass = 'min-h-14 rounded-button border border-light-border bg-light-surface px-md text-base text-light-text dark:border-dark-border dark:bg-dark-surface dark:text-dark-text web:focus-visible:outline web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-brand';

export default function Login() {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const remaining = Math.max(0, Math.ceil((resendAt - now) / 1000));
  useEffect(() => {
    if (!sentTo) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [sentTo]);

  async function submit(action: 'request' | 'resend' | 'verify') {
    if (locked.current || (action === 'verify' && code.length !== 6) || (action === 'resend' && remaining > 0)) return;
    const address = (sentTo ?? email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('Enter a valid email address.');
      return;
    }
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const client = getSupabaseClient();
      const { error: authError } = action === 'verify'
        ? await client.auth.verifyOtp({ email: address, token: code, type: 'email' })
        : await client.auth.signInWithOtp({ email: address });
      if (authError) throw authError;
      if (action !== 'verify') {
        setSentTo(address);
        setCode('');
        setNow(Date.now());
        setResendAt(Date.now() + 60_000);
      }
    } catch (caught) { setError(authErrorMessage(caught)); }
    finally { locked.current = false; setBusy(false); }
  }

  return <AuthFrame title={sentTo ? 'Check your email' : 'Sign in to Maple'}>
    {sentTo ? <>
      <Text className="text-base leading-6 text-light-muted dark:text-dark-muted">We sent a 6-digit code to:{'\n'}<Text className="font-semibold text-light-text dark:text-dark-text">{sentTo}</Text></Text>
      <View className="gap-sm">
        <Text nativeID="code-label" className="text-sm font-semibold text-light-text dark:text-dark-text">Verification code</Text>
        <TextInput accessibilityLabel="Verification code" accessibilityLabelledBy="code-label" value={code} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" inputMode="numeric" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={6} editable={!busy} onSubmitEditing={() => void submit('verify')} className={inputClass} />
      </View>
      <AuthError message={error} />
      <Button label={busy ? 'Please wait…' : 'Verify'} disabled={busy || code.length !== 6} onPress={() => void submit('verify')} />
      <Button label={remaining ? `Resend code in ${remaining}s` : 'Resend code'} variant="secondary" disabled={busy || remaining > 0} onPress={() => void submit('resend')} />
      <Button label="Change email" variant="secondary" disabled={busy} onPress={() => { setSentTo(null); setCode(''); setError(null); }} />
    </> : <>
      <Text className="text-base leading-6 text-light-muted dark:text-dark-muted">New here or returning? Use your email to receive a sign-in code.</Text>
      <View className="gap-sm">
        <Text nativeID="email-label" className="text-sm font-semibold text-light-text dark:text-dark-text">Email address</Text>
        <TextInput accessibilityLabel="Email address" accessibilityLabelledBy="email-label" value={email} onChangeText={setEmail} keyboardType="email-address" inputMode="email" textContentType="emailAddress" autoComplete="email" autoCapitalize="none" autoCorrect={false} editable={!busy} onSubmitEditing={() => void submit('request')} className={inputClass} />
      </View>
      <AuthError message={error} />
      <Button label={busy ? 'Sending…' : 'Continue'} disabled={busy} onPress={() => void submit('request')} />
    </>}
  </AuthFrame>;
}
