import { useEffect, useState } from 'react';
import { Link, router } from 'expo-router';
import { Text } from 'react-native';
import { RequireProfile } from '@/components/auth/RequireProfile';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/providers/SessionProvider';
import { textStyle } from '@/features/profiles/ProfileFields';
import { EventForm } from '@/features/events/EventForm';
import { emptyEvent } from '@/features/events/validation';
import { createEvent, getMyAdminOrganizations, type AdminOrganization } from '@/features/events/data';
function NewEventForm() {
  const [organizations, setOrganizations] = useState<AdminOrganization[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void getMyAdminOrganizations().then(rows => { if (active) setOrganizations(rows); })
      .catch(() => { if (active) setError('We could not load your administered organizations. Please retry.'); });
    return () => { active = false; };
  }, [attempt]);
  if (error) return <AuthFrame title="Unable to load organizations"><AuthError message={error} /><Button label="Retry" onPress={() => { setError(null); setAttempt(n => n + 1); }} /></AuthFrame>;
  if (!organizations) return <AuthFrame title="Loading organizations" />;
  if (!organizations.length) return <AuthFrame title="Organization required"><Text className={textStyle}>You need an organization before creating an event.</Text><Link href="/org/new" asChild><Button label="Create organization" /></Link></AuthFrame>;
  return <AuthFrame title="Create event"><EventForm organizations={organizations}
    initial={{ ...emptyEvent(), org_id: organizations.length === 1 ? organizations[0].id : '' }}
    onSave={async input => { const event = await createEvent(input); router.replace({ pathname: '/events/[slug]', params: { slug: event.slug } }); }} />
    <Link href="/me" asChild><Button label="Cancel" variant="secondary" /></Link>
  </AuthFrame>;
}
export default function NewEvent() {
  const { profile } = useSession();
  return <RequireProfile>{profile?.role === 'organizer' ? <NewEventForm key={profile.id} /> : <AuthFrame title="Event creation unavailable"><Text className={textStyle}>Only Organizer profiles can create events.</Text><Link href="/me">Back to profile</Link></AuthFrame>}</RequireProfile>;
}
