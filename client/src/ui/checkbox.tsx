import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/ui/themed-text';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read by screen readers. The visible `children` may contain links, so they sit outside the box. */
  label: string;
  children: ReactNode;
  error?: string;
};

// One checkbox with a label, like "I agree to the Terms". MultiChips picks several options.
export function Checkbox({ checked, onChange, label, children, error }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <View style={styles.row}>
        <Pressable
          role="checkbox"
          aria-checked={checked}
          accessibilityLabel={label}
          onPress={() => onChange(!checked)}
          style={styles.target}>
          <View
            style={[
              styles.box,
              {
                borderColor: error ? theme.danger : checked ? theme.brand : theme.textSecondary,
                backgroundColor: checked ? theme.brand : 'transparent',
              },
            ]}>
            {checked && <ThemedText style={[styles.tick, { color: theme.onBrand }]}>✓</ThemedText>}
          </View>
        </Pressable>
        <View style={styles.label}>{children}</View>
      </View>
      {error && (
        <ThemedText type="small" role="alert" themeColor="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center' },
  target: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  box: { width: 22, height: 22, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  tick: { fontSize: 14, lineHeight: 16, fontWeight: 700 },
  label: { flex: 1 },
});
