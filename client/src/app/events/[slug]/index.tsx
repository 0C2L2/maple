import { useRef, useState } from 'react';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { Text } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/features/profiles/ProfileFields';
import { safeWebsite } from '@/features/organizations/validation';
import { preferenceLabel } from '@/constants/taxonomy';
import { useEvent } from '@/features/events/EventContext';
import { publishEvent } from '@/features/events/data';
import { displayDate } from '@/features/events/dates';
import { formats } from '@/features/events/validation';
export default function EventPage() {
  const { event, organization, canManage, loading, error, retry, setEvent } = useEvent();
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const lock = useRef(false);
  if (loading) return <AuthFrame title="Loading event" />;
  if (error) return <AuthFrame title="Unable to load event"><AuthError message={error} /><Button label="Retry" onPress={retry} /></AuthFrame>;
  if (!event || !organization) return <AuthFrame title="Event unavailable"><Text className={textStyle}>This event was not found or is not available to you.</Text><Link href="/me">Back to profile</Link></AuthFrame>;
  const website = safeWebsite(event.website);
  async function changeStatus() {
    if (lock.current || !event) return;
    lock.current = true; setBusy(true); setFailure(null);
    try { setEvent(await publishEvent(event.id, event.status === 'draft')); }
    catch (caught) { setFailure(caught instanceof Error ? caught.message : 'Unable to publish. Please retry.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <AuthFrame title={event.title}>
    <Head><title>{event.title} · Maple</title></Head>
    <Text className={textStyle}>{event.status === 'draft' ? 'Draft - visible only to Organizer admins of this organization.' : 'Published'}</Text>
    <Link href={{ pathname: '/org/[slug]', params: { slug: organization.slug } }} className={textStyle}>{organization.name}</Link>
    <Text className={textStyle}>{displayDate(event.starts_at, event.timezone)} – {displayDate(event.ends_at, event.timezone)}</Text>
    <Text className={textStyle}>Timezone: {event.timezone}</Text>
    <Text className={textStyle}>{formats[event.format]}</Text>
    {[event.venue_name, event.city, event.country].some(Boolean) ? <Text className={textStyle}>{[event.venue_name, event.city, event.country].filter(Boolean).join(', ')}</Text> : null}
    <Text className={textStyle}>{event.description || 'No description added yet.'}</Text>
    <Text className={textStyle}>Categories: {event.categories.map(preferenceLabel).join(', ')}</Text>
    <Text className={textStyle}>Audience: {event.audience_types.map(preferenceLabel).join(', ')}</Text>
    <Text className={textStyle}>Attendance: {preferenceLabel(event.attendance_band)}</Text>
    {website ? <Link href={website as `https://${string}`} target="_blank" rel="noopener noreferrer"
      accessibilityLabel="Visit event website (external link)" style={{ flexShrink: 1 }} className={textStyle + ' underline web:break-all'}>{website}</Link> : null}
    {canManage ? <>
      <Link href={{ pathname: '/events/[slug]/edit', params: { slug: event.slug } }} asChild><Button label="Edit event" disabled={busy} /></Link>
      <Button label={busy ? 'Saving…' : event.status === 'draft' ? 'Publish event' : 'Unpublish event'} disabled={busy} onPress={() => void changeStatus()} />
    </> : null}
    <AuthError message={failure} />
  </AuthFrame>;
}
