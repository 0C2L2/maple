import { router, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { Button } from '@/ui/button';
import { ThemedText } from '@/ui/themed-text';

type Props = { title: string; body?: string; action?: { title: string; href: Href } };

// Empty lists and "not found" pages.
export function Notice({ title, body, action }: Props) {
  return (
    <View style={styles.notice}>
      <ThemedText type="subheading">{title}</ThemedText>
      {body && (
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {body}
        </ThemedText>
      )}
      {action && <Button title={action.title} variant="secondary" onPress={() => router.push(action.href)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  center: { textAlign: 'center' },
});
