import { Slot, Stack } from 'expo-router';
import { View } from 'react-native';

import { useSession } from '@/features/auth/session';
import { TopNav } from '@/features/shell/top-nav';
import { SiteHeader } from '@/features/site/components/site-header';
import { useIsWide } from '@/hooks/use-is-wide';

export default function PublicLayout() {
  const { session } = useSession();
  const wide = useIsWide();
  // In the iOS/Android app, public pages (organizations, legal) open as normal screens. Find and post pages
  // live in (app) and are public there.
  if (process.env.EXPO_OS !== 'web') return <Stack />;
  // Signed-in desktop visitors keep the app's top bar; everyone else sees the website header.
  return (
    <View style={{ flex: 1 }}>
      {session && wide ? <TopNav /> : <SiteHeader />}
      <Slot />
    </View>
  );
}
