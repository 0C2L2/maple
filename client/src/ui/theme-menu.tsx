import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { setThemePreference, useThemePreference, type ThemePreference } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';
import { ThemedText } from '@/ui/themed-text';

const MODES: { value: ThemePreference; label: string; icon: SymbolViewProps['name'] }[] = [
  { value: 'system', label: 'System', icon: { ios: 'desktopcomputer', android: 'desktop_windows', web: 'desktop_windows' } },
  { value: 'light', label: 'Light', icon: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' } },
  { value: 'dark', label: 'Dark', icon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' } },
];
const CHECK: SymbolViewProps['name'] = { ios: 'checkmark', android: 'check', web: 'check' };

// Light, dark, or system mode (website only; the apps follow the phone). An icon button showing the current
// mode opens a small menu; picking a mode, Escape, or a click outside closes it.
export function ThemeMenu() {
  const theme = useTheme();
  const preference = useThemePreference();
  const [open, setOpen] = useState(false);
  const box = useRef<View>(null);

  useEffect(() => {
    if (!open) return;
    // React Native Web views are DOM elements.
    const outside = (e: MouseEvent) => {
      if (!(box.current as unknown as HTMLElement | null)?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (Platform.OS !== 'web') return null;
  const current = MODES.find((m) => m.value === preference) ?? MODES[0];

  return (
    <View ref={box}>
      <Pressable
        {...motion({ press: 'secondary' })}
        role="button"
        aria-haspopup="menu"
        aria-expanded={open}
        accessibilityLabel={`Color mode: ${current.label}`}
        hitSlop={2}
        onPress={() => setOpen((o) => !o)}
        style={[styles.button, { borderColor: open ? theme.brand : theme.border }]}>
        <SymbolView name={current.icon} tintColor={theme.text} size={20} />
      </Pressable>
      {open && (
        <View
          {...motion({ open: '' })}
          role="menu"
          aria-label="Color mode"
          style={[styles.menu, { backgroundColor: theme.background, borderColor: theme.border }]}>
          {MODES.map((mode) => {
            const selected = mode.value === preference;
            return (
              <Pressable
                key={mode.value}
                {...motion({ press: 'secondary' })}
                // The right ARIA role for a pick-one menu; React Native's types lack it, React Native Web renders it.
                role={'menuitemradio' as 'menuitem'}
                aria-checked={selected}
                onPress={() => {
                  setThemePreference(mode.value);
                  setOpen(false);
                }}
                style={styles.item}>
                <SymbolView name={mode.icon} tintColor={theme.text} size={18} />
                <ThemedText type={selected ? 'bodyStrong' : 'default'} style={styles.label}>
                  {mode.label}
                </ThemedText>
                {selected && <SymbolView name={CHECK} tintColor={theme.link} size={18} />}
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  menu: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 20,
    minWidth: 180,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.one,
    gap: Spacing.half,
    boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.4)',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  label: { flex: 1 },
});
