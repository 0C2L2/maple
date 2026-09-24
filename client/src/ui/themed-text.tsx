import { StyleSheet, Text, type TextProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
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

  return <Text {...heading} style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  display: { fontSize: 38, lineHeight: 44, fontWeight: 700 },
  title: { fontSize: 30, lineHeight: 38, fontWeight: 700 },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: 700 },
  subheading: { fontSize: 18, lineHeight: 26, fontWeight: 700 },
  lead: { fontSize: 19, lineHeight: 29, fontWeight: 400 },
  default: { fontSize: 16, lineHeight: 24, fontWeight: 400 },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: 600 },
  small: { fontSize: 14, lineHeight: 20, fontWeight: 400 },
  smallStrong: { fontSize: 14, lineHeight: 20, fontWeight: 600 },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: 500 },
});
