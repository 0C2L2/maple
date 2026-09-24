import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useSession } from '@/features/auth/session';
import { useLiveUpdates } from '@/features/notifications/live-updates';
import { TopNav } from '@/features/shell/top-nav';
import { useIsWide } from '@/hooks/use-is-wide';
import { Loading } from '@/ui/loading';

// Signed-in area: signed-out visitors go to /login, new accounts create their organization page first.
// Desktop web gets the LinkedIn-style top bar; phones and the apps get native headers and bottom tabs.
export default function AppLayout() {
  const { session, org, isLoading } = useSession();
  const wide = useIsWide();
  useLiveUpdates();
  if (isLoading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (!org) return <Redirect href="/onboarding" />;

  const stack = (
    // Back buttons show only the arrow; the previous title can be a route group name like "(public)".
    <Stack screenOptions={{ headerShown: !wide, headerBackButtonDisplayMode: 'minimal', headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
  if (!wide) return stack;
  return (
    <View style={{ flex: 1 }}>
      <TopNav />
      {stack}
    </View>
  );
}
