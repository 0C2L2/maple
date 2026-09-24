import { Stack } from 'expo-router';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { FormWidth, MaxContentWidth, ReadingWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PageMeta } from '@/ui/page-meta';

type Props = {
  /** Browser tab title and header title. */
  title: string;
  children: ReactNode;
  /** form 560 · reading 680 · page 880 (organization pages) · wide 1120 (three-column layouts). */
  width?: keyof typeof WIDTHS;
};

const WIDTHS = { form: FormWidth, reading: ReadingWidth, page: 880, wide: MaxContentWidth };

// A scrolling page with a centered column. Every product screen uses it.
export function Screen({ title, children, width = 'reading' }: Props) {
  const theme = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title }} />
      <PageMeta title={title} />
      <View style={[styles.column, { maxWidth: WIDTHS[width] }]}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: Spacing.four },
  column: { width: '100%', alignSelf: 'center', gap: Spacing.four },
});
