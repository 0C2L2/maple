import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  /** Type scale from docs/product/DESIGN_SYSTEM.md §3. */
  type?: keyof typeof styles;
  themeColor?: ThemeColor;
  /** Marks the text as a heading: <h1>–<h3> on the web, a header for VoiceOver/TalkBack. */
  level?: 1 | 2 | 3;
};

export function ThemedText({ style, type = 'default', themeColor, level, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  // aria-level isn't in React Native's types yet; React Native Web uses it to pick the <hN> tag.
  const heading = level ? ({ role: 'heading', 'aria-level': level } as TextProps) : undefined;

  return (
    <Text {...heading} style={[base, { color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />
  );
}

// Geist on the web (src/global.css); the phone's system font in the apps.
const base = { fontFamily: Fonts.sans };

// Large type is tighter (negative tracking) so headlines read as one shape.
const styles = StyleSheet.create({
  display: { fontSize: 44, lineHeight: 50, fontWeight: 700, letterSpacing: -1.2 },
  title: { fontSize: 32, lineHeight: 40, fontWeight: 700, letterSpacing: -0.7 },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: 600, letterSpacing: -0.2 },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: 600, letterSpacing: -0.1 },
  lead: { fontSize: 19, lineHeight: 30, fontWeight: 400 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: 600 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: 500, letterSpacing: 0.3 },
});
