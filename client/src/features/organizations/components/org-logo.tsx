import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

// The organization's logo, or its initials on a tinted square when there is no logo yet.
export function OrgLogo({ name, url, size = 48 }: { name: string; url: string | null | undefined; size?: number }) {
  const theme = useTheme();
  const box = { width: size, height: size, borderRadius: Math.round(size * 0.16) };
  if (url) return <Image source={{ uri: url }} style={box} contentFit="cover" accessibilityLabel={`${name} logo`} />;

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <View
      aria-hidden
      style={[box, { backgroundColor: theme.backgroundSelected, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: theme.text, fontWeight: 700, fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// The wide cover image at the top of an organization page, or a plain tinted strip without one.
export function OrgBanner({ url, height }: { url: string | null | undefined; height: number }) {
  const theme = useTheme();
  return (
    <View style={{ height, backgroundColor: theme.backgroundSelected }}>
      {url && <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="" />}
    </View>
  );
}
