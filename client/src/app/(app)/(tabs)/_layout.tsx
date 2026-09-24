import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useUnreadCount } from '@/features/notifications/use-unread';
import { MeButton, SearchButton } from '@/features/shell/header-buttons';
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

export default function TabsLayout() {
  const wide = useIsWide();
  const theme = useTheme();
  const unread = useUnreadCount();
  return (
    <Tabs
      // Desktop web navigates with the top bar, so it has no tab bar.
      tabBar={wide ? () => null : undefined}
      screenOptions={{
        headerShown: !wide,
        tabBarActiveTintColor: theme.link,
        headerLeft: () => <MeButton />,
        headerRight: () => <SearchButton />,
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
