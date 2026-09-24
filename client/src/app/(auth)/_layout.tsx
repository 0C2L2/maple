import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/providers/SessionProvider';

export default function AuthLayout() {
  const { session, loading, error, retry } = useSession();
  if (loading) return <AuthFrame title="One moment"><Text accessibilityLiveRegion="polite" className="text-light-muted dark:text-dark-muted">Restoring your session…</Text></AuthFrame>;
  if (error) return <AuthFrame title="Unable to continue"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!session}><Stack.Screen name="account-ready" /></Stack.Protected>
  </Stack>;
}
