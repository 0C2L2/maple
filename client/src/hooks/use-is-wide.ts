import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

const subscribe = (onChange: () => void) => {
  const subscription = Dimensions.addEventListener('change', onChange);
  return () => subscription.remove();
};
// Static pages are pre-rendered without a window, so hydrate as narrow; React re-renders with the real width
// right after. (Reading the width during hydration would leave the pre-rendered layout's styles in place.)
const getServerSnapshot = () => false;

/**
 * Desktop-width web: the top bar and side columns. Phones and the apps use bottom tabs.
 * `minWidth` raises the breakpoint for layouts that need more room (the website header's full menu).
 */
export function useIsWide(minWidth = 900) {
  return useSyncExternalStore(
    subscribe,
    () => process.env.EXPO_OS === 'web' && Dimensions.get('window').width >= minWidth,
    getServerSnapshot,
  );
}
