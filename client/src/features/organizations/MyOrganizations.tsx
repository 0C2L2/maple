import { useCallback, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { AuthError } from '@/components/auth/AuthFrame';
import { useSession } from '@/providers/SessionProvider';
import { getMyOrganizations } from './data';
import { orgTypes } from './validation';
export function MyOrganizations() {
  const { profile } = useSession();
  const [rows, setRows] = useState<Awaited<ReturnType<typeof getMyOrganizations>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const id = profile?.id;
  useFocusEffect(useCallback(() => {
    let active = true;
    void attempt;
    void Promise.resolve().then(async () => {
      if (!active || !id) return;
      setLoading(true); setError(null);
      try { const next = await getMyOrganizations(); if (active) setRows(next); }
      catch { if (active) setError('We could not load your organizations. Please retry.'); }
      finally { if (active) setLoading(false); }
    });
    return () => { active = false; };
  }, [id, attempt]));
  return <View className="gap-md">
    <Text accessibilityRole="header" className="text-lg font-semibold text-light-text dark:text-dark-text">Organizations</Text>
    {loading ? <Text className="text-light-muted dark:text-dark-muted">Loading organizations…</Text> : error ? <><AuthError message={error} /><Button label="Retry organizations" onPress={() => setAttempt((n) => n + 1)} /></> : <>
      {!rows.length ? <Text className="text-light-text dark:text-dark-text">You haven&apos;t added an organization yet.</Text> : rows.map((org) => <View key={org.id} className="gap-sm">
        <Text className="text-base font-semibold text-light-text dark:text-dark-text">{org.name}</Text><Text className="text-light-muted dark:text-dark-muted">{orgTypes[org.type]}</Text>
        <Link href={{ pathname: '/org/[slug]', params: { slug: org.slug } }} asChild><Button label={'View ' + org.name} variant="secondary" /></Link>
      </View>)}
      <Link href="/org/new" asChild><Button label="Create organization" variant="secondary" /></Link>
    </>}
  </View>;
}
