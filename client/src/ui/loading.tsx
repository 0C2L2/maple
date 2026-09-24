import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedView } from '@/ui/themed-view';
import { useTheme } from '@/hooks/use-theme';

export function Loading() {
  const theme = useTheme();
  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator color={theme.brand} accessibilityLabel="Loading" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
