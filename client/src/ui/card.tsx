import { Link, type Href } from 'expo-router';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';

type Props = { children: ReactNode; href?: Href; onPress?: () => void; style?: StyleProp<ViewStyle> };

// A bordered box. With `href` the whole card is a link (an <a> on the web), so don't nest buttons in it.
// `onPress` runs before navigating (used for analytics). Linked cards lift on hover on the web.
export function Card({ children, href, onPress, style }: Props) {
  const theme = useTheme();
  const box = [styles.card, { borderColor: theme.border, backgroundColor: theme.background }, style];
  if (!href) return <View style={box}>{children}</View>;
  return (
    // Link's Slot merges style objects and drops style functions, so this must be a plain object.
    // ponytail: no pressed highlight; the web shows a pointer cursor, add an overlay if native needs feedback.
    <Link href={href} asChild onPress={onPress}>
      <Pressable {...motion({ lift: '' })} style={StyleSheet.flatten(box)}>
        {children}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
});
