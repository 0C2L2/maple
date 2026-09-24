import { Pressable, StyleSheet, Text } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
};

// On the web the button also darkens (primary) or tints (secondary) on hover and gives a little on press.
export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
  const theme = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      {...motion(disabled ? {} : { press: variant })}
      role="button"
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        primary ? { backgroundColor: theme.brand } : { borderColor: theme.border, borderWidth: 1 },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.label, { color: primary ? theme.onBrand : theme.text }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 12,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 600,
  },
  dimmed: {
    opacity: 0.7,
  },
});
