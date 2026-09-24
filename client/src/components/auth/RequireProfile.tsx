import type { PropsWithChildren } from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '@/providers/SessionProvider';
import { AuthError, AuthFrame } from './AuthFrame';
import { Button } from '@/components/ui/Button';
export function RequireProfile({ children }: PropsWithChildren) {
  const { session, profile, loading, profileLoading, error, profileError, retry, retryProfile } = useSession();
  if (loading || profileLoading) return <AuthFrame title="Loading profile" />;
  if (error || profileError) return <AuthFrame title="Unable to continue"><AuthError message={error || profileError} /><Button label="Retry" onPress={error ? retry : retryProfile} /></AuthFrame>;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/onboarding" />;
  return children;
}
