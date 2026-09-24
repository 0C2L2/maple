import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

// The visitor's choice, kept in this browser. +html.tsx reads the same key before the page paints.
const KEY = 'maple-theme';
const listeners = new Set<() => void>();
let current: ThemePreference | undefined;

function read(): ThemePreference {
  try {
    const saved = localStorage.getItem(KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch {
    return 'system';
  }
}

const getPreference = () => (current ??= read());

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setThemePreference(preference: ThemePreference) {
  current = preference;
  try {
    if (preference === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // Storage blocked (private mode): the choice still applies until the tab closes.
  }
  if (preference === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = preference;
  listeners.forEach((listener) => listener());
}

export function useThemePreference() {
  return useSyncExternalStore(subscribe, getPreference, () => 'system' as ThemePreference);
}

const noop = () => () => {};

/**
 * Pages are pre-rendered in light mode (the build has no color scheme). While hydrating, React uses
 * the server snapshot (false) so the first render matches that HTML, then re-renders with the visitor's
 * choice, or the device setting when they picked System.
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const preference = useThemePreference();
  const system = useRNColorScheme();
  if (!hydrated) return 'light';
  return preference === 'system' ? system : preference;
}
