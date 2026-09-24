import { Stack } from 'expo-router';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/providers/SessionProvider';

export default function AuthLayout() {
  const { session, loading, error, retry, profile, profileLoading, profileError, retryProfile } = useSession();
  if (loading || profileLoading) return <AuthFrame title="One moment"><Text accessibilityLiveRegion="polite" className="text-light-muted dark:text-dark-muted">Restoring your session…</Text></AuthFrame>;
  if (error) return <AuthFrame title="Unable to continue"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  if (profileError) return <AuthFrame title="Unable to load profile"><AuthError message={profileError} /><Button label="Retry profile" onPress={retryProfile} /></AuthFrame>;
  return <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
    <Stack.Protected guard={!session}><Stack.Screen name="login" /></Stack.Protected>
    <Stack.Protected guard={!!session && !profile}><Stack.Screen name="onboarding" /></Stack.Protected>
    <Stack.Protected guard={!!session && !!profile}><Stack.Screen name="me/index" /><Stack.Screen name="me/edit" /></Stack.Protected>
  </Stack>;
}
