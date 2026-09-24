import { Slot, useLocalSearchParams } from 'expo-router';
import { EventProvider } from '@/features/events/EventContext';
import { useSession } from '@/providers/SessionProvider';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
export default function EventDetailLayout() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session, loading, profileLoading, error, profileError, retry, retryProfile } = useSession();
  if (loading || profileLoading) return <AuthFrame title="Loading event" />;
  if (error || profileError) return <AuthFrame title="Unable to continue"><AuthError message={error || profileError} /><Button label="Retry" onPress={error ? retry : retryProfile} /></AuthFrame>;
  return <EventProvider key={slug + ':' + (session?.user.id || 'anonymous')} slug={slug}><Slot /></EventProvider>;
}
