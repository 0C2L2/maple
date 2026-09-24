import { useState } from 'react';
import { Pressable, StyleSheet, View, type TextInputProps } from 'react-native';

import { TextField } from '@/ui/text-field';
import { ThemedText } from '@/ui/themed-text';

export const EMAIL = /^\S+@\S+\.\S+$/;
// The same rule the server enforces (supabase/config.toml: minimum_password_length, password_requirements).
export const STRONG_PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
export const PASSWORD_RULE = 'At least 8 characters, with letters and numbers.';

type Props = Omit<TextInputProps, 'secureTextEntry'> & { label?: string; error?: string };

// A password input with a Show/Hide toggle beside its label.
export function PasswordField({ label = 'Password', ...props }: Props) {
  const [shown, setShown] = useState(false);
  return (
    <View>
      <TextField label={label} secureTextEntry={!shown} autoCapitalize="none" autoCorrect={false} {...props} />
      <Pressable
        role="button"
        aria-pressed={shown}
        accessibilityLabel={shown ? 'Hide password' : 'Show password'}
        onPress={() => setShown((s) => !s)}
        hitSlop={8}
        style={styles.toggle}>
        <ThemedText type="smallStrong" themeColor="link">
          {shown ? 'Hide' : 'Show'}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { position: 'absolute', top: 0, right: 0 },
});
