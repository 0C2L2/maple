import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Gate } from '@/features/auth/gate';
import { useSession } from '@/features/auth/session';
import { useLiveUpdates } from '@/features/notifications/live-updates';
import { TopNav } from '@/features/shell/top-nav';
import { SiteHeader } from '@/features/site/components/site-header';
import { useIsWide } from '@/hooks/use-is-wide';

// Deep links open on top of the tabs, so a shared post gets a Back button to Find.
export const unstable_settings = { initialRouteName: '(tabs)' };

// Signed-in area. Find and post pages are public too (D-026): signed-out visitors browse them with the
// website header. The stack always renders (so it keeps the URL's route); each screen waits for the session
// and redirects through <Gate>. Desktop web gets the top bar; phones and the apps get native headers + tabs.
export default function AppLayout() {
  const { session, isLoading } = useSession();
  const wide = useIsWide();
  useLiveUpdates();

  const header = isLoading ? null : !session ? <SiteHeader /> : wide ? <TopNav /> : null;
  return (
    // One fixed wrapper: changing it between renders would remount the stack and lose its route.
    <View style={{ flex: 1 }}>
      {header}
      <Stack
        screenOptions={{
          headerShown: !wide && !!session,
          headerBackButtonDisplayMode: 'minimal',
          headerBackTitle: 'Back',
        }}
        // The tabs gate each tab themselves; post pages are public.
        screenLayout={({ children, route }) =>
          route.name === '(tabs)' ? children : <Gate isPublic={route.name === 'posts/[id]'}>{children}</Gate>
        }>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}
