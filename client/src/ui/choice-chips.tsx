import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/ui/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  options: readonly { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
};

// Pick one of a few options (a radio group drawn as pills). Works the same on web, iOS, and Android.
export function ChoiceChips({ label, options, value, onChange, error }: Props) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallStrong">{label}</ThemedText>
      <View role="radiogroup" aria-label={label} style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              role="radio"
              aria-checked={selected}
              onPress={() => onChange(option.value)}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.brand : error ? theme.danger : theme.border,
                  backgroundColor: selected ? theme.backgroundSelected : 'transparent',
                },
              ]}>
              <ThemedText type="small">{option.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      {error && (
        <ThemedText type="small" role="alert" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
  },
});
