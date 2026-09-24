import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';

import { Colors } from '@/constants/theme';
import { SessionProvider } from '@/features/auth/session';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Navigation (active tab, header tint, screen background) follows the Maple palette.
const light = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: Colors.light.brand, background: Colors.light.background },
};
const dark = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, primary: Colors.dark.link, background: Colors.dark.background },
};

// No retries here: supabase-js already retries failed reads 3 times with backoff.
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: false } } });

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ThemeProvider value={scheme === 'dark' ? dark : light}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
