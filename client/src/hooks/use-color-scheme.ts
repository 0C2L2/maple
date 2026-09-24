export { useColorScheme } from 'react-native';

// The apps follow the phone's light/dark setting; only the website has a switch (use-color-scheme.web.ts).
export type ThemePreference = 'system' | 'light' | 'dark';
export const useThemePreference = (): ThemePreference => 'system';
export const setThemePreference = (_preference: ThemePreference) => {};
