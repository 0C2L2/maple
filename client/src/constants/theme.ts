/**
 * Maple colors, taken from the maple-leaf logo, for light and dark mode.
 * `brand` keeps white text (`onBrand`) above 4.5:1 contrast in both modes; `link` is the brand color
 * lightened enough to read as text on the dark background.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1917',
    background: '#FDFCFA',
    backgroundElement: '#F7F3EF',
    backgroundSelected: '#EFE6DD',
    textSecondary: '#57534E',
    border: '#E7E0D9',
    brand: '#C8331B',
    /** A soft wash of the brand color for bands, icon tiles, and highlights. */
    brandSoft: '#FBEDE8',
    onBrand: '#FFFFFF',
    link: '#C8331B',
    danger: '#B42318',
  },
  dark: {
    text: '#FAFAF9',
    background: '#16110F',
    backgroundElement: '#221A16',
    backgroundSelected: '#2F241F',
    textSecondary: '#B5A9A1',
    border: '#3A2E28',
    brand: '#C8331B',
    brandSoft: '#3A1D15',
    onBrand: '#FFFFFF',
    link: '#FF8A5C',
    danger: '#F97066',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 1280;
export const ReadingWidth = 760;
export const FormWidth = 560;
