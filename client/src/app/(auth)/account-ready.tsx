import { useRef, useState } from 'react';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { authErrorMessage } from '@/lib/supabase/errors';
import { useSession } from '@/providers/SessionProvider';

export default function AccountReady() {
  const { user, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  async function leave() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try { await signOut(); }
    catch (caught) { setError(authErrorMessage(caught)); }
    finally { locked.current = false; setBusy(false); }
  }
  return <AuthFrame title="Signed in successfully.">
    <Text className="text-sm leading-6 text-light-muted dark:text-dark-muted">Temporary development screen · Checkpoint 3</Text>
    <Text className="text-base leading-7 text-light-text dark:text-dark-text">Email:{'\n'}{user?.email}</Text>
    <AuthError message={error} />
    <Button label={busy ? 'Signing out…' : 'Sign out'} disabled={busy} onPress={() => void leave()} />
  </AuthFrame>;
}
