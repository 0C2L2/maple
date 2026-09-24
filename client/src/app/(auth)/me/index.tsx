import { useState } from 'react';
import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';
import { AuthError, AuthFrame } from '@/components/auth/AuthFrame';
import { Button } from '@/components/ui/Button';
import { PreferenceSummary, textStyle } from '@/features/profiles/ProfileFields';
import { useSession } from '@/providers/SessionProvider';

export default function Me() {
  const { profile, signOut } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;
  return <AuthFrame title={profile.name}>
    {profile.photo_url ? <Image source={{ uri: profile.photo_url }} accessibilityLabel="Profile photo" style={{ width: 72, height: 72, borderRadius: 36 }} /> : <View className="h-16 w-16 items-center justify-center rounded-full bg-brand"><Text accessibilityLabel="Profile initials" className="text-xl font-semibold text-on-brand">{profile.name.trim().split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join('')}</Text></View>}
    <Text className={textStyle}>@{profile.handle}</Text><Text className={textStyle}>{profile.headline}</Text>
    <Text className="text-sm font-semibold text-light-text dark:text-dark-text">{profile.role === 'organizer' ? 'Organizer' : 'Sponsor'}</Text>
    {profile.location ? <Text className={textStyle}>{profile.location}</Text> : null}
    <Text accessibilityRole="header" className="text-lg font-semibold text-light-text dark:text-dark-text">About</Text>
    <Text className={textStyle}>{profile.bio || 'No bio added yet.'}</Text>
    <PreferenceSummary profile={profile} />
    <Text accessibilityLabel={`Profile completeness ${profile.completeness} percent`} className={textStyle}>Profile completeness: {profile.completeness}%</Text>
    <Link href="/me/edit" asChild><Button label="Edit profile" /></Link>
    <AuthError message={error} />
    <Button label={busy ? 'Signing out…' : 'Sign out'} variant="secondary" disabled={busy} onPress={() => { setBusy(true); void signOut().catch(() => setError('Could not sign out. Please retry.')).finally(() => setBusy(false)); }} />
  </AuthFrame>;
}
