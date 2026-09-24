import { Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/ui/themed-text';

type Props<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
};

// Pick any number of options (checkboxes drawn as pills). ChoiceChips is the pick-one version.
export function MultiChips<T extends string>({ label, options, value, onChange }: Props<T>) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallStrong">{label}</ThemedText>
      <View role="group" aria-label={label} style={styles.row}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Pressable
              key={option.value}
              role="checkbox"
              aria-checked={selected}
              onPress={() =>
                onChange(selected ? value.filter((v) => v !== option.value) : [...value, option.value])
              }
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.brand : theme.border,
                  backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                },
              ]}>
              <ThemedText type="small">{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
});
