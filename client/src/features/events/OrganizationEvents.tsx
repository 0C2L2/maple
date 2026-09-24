import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthError } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { textStyle } from '@/features/profiles/ProfileFields';
import { getOrganizationEvents, type Event } from './data';
import { displayDate } from './dates';
export function OrganizationEvents({ orgId, canManage }: { orgId: string; canManage: boolean }) {
  const [rows, setRows] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    void attempt;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setLoading(true); setError(null);
      try { const events = await getOrganizationEvents(orgId); if (active) setRows(events); }
      catch { if (active) setError('We could not load events. Please retry.'); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [orgId, attempt]));
  return <View className="gap-md">
    <Text accessibilityRole="header" className={textStyle}>Events</Text>
    {loading ? <Text className={textStyle}>Loading events…</Text> : error ? <><AuthError message={error} /><Button label="Retry events" onPress={() => setAttempt(n => n + 1)} /></> :
      rows.length ? rows.map(event => <View key={event.id} className="gap-sm">
        <Link href={{ pathname: '/events/[slug]', params: { slug: event.slug } }} className={textStyle}>{event.title}</Link>
        <Text className={textStyle}>{event.status === 'draft' ? 'Draft' : 'Published'} · {displayDate(event.starts_at, event.timezone)} · {event.timezone}</Text>
      </View>) : <Text className={textStyle}>No events available yet.</Text>}
    {canManage ? <Link href="/events/new" asChild><Button label="Create event" /></Link> : null}
  </View>;
}
