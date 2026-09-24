import { Link, router } from 'expo-router';
import { Text } from 'react-native';
import { RequireProfile } from '@/components/auth/RequireProfile';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/features/profiles/ProfileFields';
import { EventForm } from '@/features/events/EventForm';
import { useEvent } from '@/features/events/EventContext';
import { eventInput, updateEvent } from '@/features/events/data';
function Editor() {
  const { event, canManage, loading, error, retry, setEvent } = useEvent();
  if (loading) return <AuthFrame title="Loading event" />;
  if (error) return <AuthFrame title="Unable to load event"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  if (!event || !canManage) return <AuthFrame title="Editing unavailable"><Text className={textStyle}>Only an Organizer admin of the owning organization can edit this event.</Text></AuthFrame>;
  return <AuthFrame title="Edit event"><EventForm key={event.id} editing initial={eventInput(event)} onSave={async input => {
    const updated = await updateEvent(event.id, input); setEvent(updated);
    router.replace({ pathname: '/events/[slug]', params: { slug: updated.slug } });
  }} /><Link href={{ pathname: '/events/[slug]', params: { slug: event.slug } }} asChild><Button label="Cancel" variant="secondary" /></Link></AuthFrame>;
}
export default function EditEvent() { return <RequireProfile><Editor /></RequireProfile>; }
