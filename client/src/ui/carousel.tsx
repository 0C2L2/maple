import { SymbolView } from 'expo-symbols';
import { Children, isValidElement, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { motion } from '@/ui/motion';
import { ThemedText } from '@/ui/themed-text';

type Props = {
  /** Section heading; also the screen-reader name of the row. */
  title: string;
  /** Shown next to the heading, e.g. a "See all" link. */
  action?: ReactNode;
  /** Widest a card gets in the scrolling row. Phones get a narrower card so the next one peeks in. */
  itemWidth: number;
  children: ReactNode;
};

const GAP = Spacing.three;

// A titled row of cards. When they all fit, they share the width as a grid (no empty row, no arrows).
// When they don't, the row scrolls sideways, snaps card by card, fades out at the edge that has more,
// and Previous/Next sit next to the heading. It never moves on its own.
export function Carousel({ title, action, itemWidth, children }: Props) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const ref = useRef<ScrollView>(null);
  const [frame, setFrame] = useState(0);
  const [x, setX] = useState(0);

  const items = Children.toArray(children);
  const width = frame ? Math.min(itemWidth, frame - 48) : itemWidth;
  const step = width + GAP;
  const max = Math.max(0, items.length * step - GAP - frame);
  const scrolls = frame > 0 && max > 1;
  const atStart = x <= 1;
  const atEnd = x >= max - 1;
  // One press moves a full screen of cards.
  const go = (dir: 1 | -1) =>
    ref.current?.scrollTo({
      x: Math.min(max, Math.max(0, x + dir * step * Math.max(1, Math.floor(frame / step)))),
      animated: !reduceMotion,
    });

  const arrow = (dir: 1 | -1) => {
    const disabled = dir === -1 ? atStart : atEnd;
    return (
      <Pressable
        {...motion(disabled ? {} : { press: 'secondary' })}
        role="button"
        accessibilityLabel={dir === -1 ? `Previous: ${title}` : `Next: ${title}`}
        aria-disabled={disabled}
        disabled={disabled}
        onPress={() => go(dir)}
        style={[styles.arrow, { borderColor: theme.border, opacity: disabled ? 0.35 : 1 }]}>
        <SymbolView
          name={
            dir === -1
              ? { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }
              : { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }
          }
          tintColor={theme.text}
          size={22}
        />
      </Pressable>
    );
  };

  const key = (item: ReactNode, i: number) => (isValidElement(item) && item.key != null ? item.key : i);

  return (
    <View role="region" aria-label={title} style={styles.wrap} onLayout={(e) => setFrame(e.nativeEvent.layout.width)}>
      <View style={styles.header}>
        <ThemedText type="title" level={2} style={styles.title}>
          {title}
        </ThemedText>
        {action}
        {scrolls && (
          <View style={styles.controls}>
            {arrow(-1)}
            {arrow(1)}
          </View>
        )}
      </View>
      {scrolls ? (
        <ScrollView
          ref={ref}
          horizontal
          {...motion({ snap: '', edges: atStart ? 'end' : atEnd ? 'start' : 'both' })}
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => setX(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={50}
          snapToInterval={step}
          decelerationRate="fast"
          contentContainerStyle={styles.row}>
          {items.map((item, i) => (
            <View key={key(item, i)} style={{ width }}>
              {item}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.grid}>
          {items.map((item, i) => (
            <View key={key(item, i)} style={[styles.cell, { flexBasis: itemWidth }]}>
              {item}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.three },
  title: { flex: 1, minWidth: 220 },
  controls: { flexDirection: 'row', gap: Spacing.two },
  row: { gap: GAP, alignItems: 'stretch' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  cell: { flexGrow: 1 },
  arrow: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
