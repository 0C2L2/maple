import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { Gate } from '@/features/auth/gate';
import { useSession } from '@/features/auth/session';
import { useUnreadCount } from '@/features/notifications/use-unread';
import { MeButton, PostButton } from '@/features/shell/header-buttons';
import { useIsWide } from '@/hooks/use-is-wide';
import { useTheme } from '@/hooks/use-theme';

// The same sections as the desktop top bar. iOS uses SF Symbols; Android and web use Material Symbols.
const TABS = [
  { name: 'find', title: 'Find', icon: { ios: 'magnifyingglass', android: 'search', web: 'search' } },
  { name: 'my-posts', title: 'My posts', icon: { ios: 'briefcase', android: 'work', web: 'work' } },
  { name: 'proposals', title: 'Proposals', icon: { ios: 'tray.full', android: 'inbox', web: 'inbox' } },
  {
    name: 'messages',
    title: 'Messaging',
    icon: { ios: 'bubble.left.and.bubble.right', android: 'forum', web: 'forum' },
  },
  { name: 'notifications', title: 'Notifications', icon: { ios: 'bell', android: 'notifications', web: 'notifications' } },
] as const;

// Find is the home tab (and the one signed-out visitors may see).
export const unstable_settings = { initialRouteName: 'find' };

export default function TabsLayout() {
  const wide = useIsWide();
  const theme = useTheme();
  const unread = useUnreadCount();
  const { session } = useSession();
  // Desktop web navigates with the top bar; signed-out visitors (browsing Find) use the website header.
  const bare = wide || !session;
  return (
    <Tabs
      tabBar={bare ? () => null : undefined}
      // Each tab waits for the session; only Find is open to signed-out visitors.
      screenLayout={({ children, route }) => <Gate isPublic={route.name === 'find'}>{children}</Gate>}
      screenOptions={{
        headerShown: !bare,
        tabBarActiveTintColor: theme.link,
        headerLeft: () => <MeButton />,
        headerRight: () => <PostButton />,
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarBadge: tab.name === 'notifications' && unread ? unread : undefined,
            tabBarIcon: ({ color, size }) => <SymbolView name={tab.icon} tintColor={color} size={size} />,
          }}
        />
      ))}
    </Tabs>
  );
}
