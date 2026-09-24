import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/ui/themed-text';

type Props<T extends string> = {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

// Underlined page tabs (Home · About · Posts …), like the tabs on a LinkedIn company page.
export function TabStrip<T extends string>({ tabs, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View role="tablist" style={[styles.strip, { borderTopColor: theme.border }]}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            role="tab"
            aria-selected={active}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, { borderBottomColor: active ? theme.brand : 'transparent' }]}>
            <ThemedText type="smallStrong" themeColor={active ? 'link' : 'textSecondary'}>
              {tab.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 1, paddingHorizontal: Spacing.two },
  tab: { minHeight: 48, justifyContent: 'center', paddingHorizontal: Spacing.three, borderBottomWidth: 3 },
});
