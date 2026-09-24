import { useSyncExternalStore } from 'react';
import { Dimensions } from 'react-native';

const subscribe = (onChange: () => void) => {
  const subscription = Dimensions.addEventListener('change', onChange);
  return () => subscription.remove();
};
const getSnapshot = () => process.env.EXPO_OS === 'web' && Dimensions.get('window').width >= 900;
// Static pages are pre-rendered without a window, so hydrate as narrow; React re-renders with the real width
// right after. (Reading the width during hydration would leave the pre-rendered layout's styles in place.)
const getServerSnapshot = () => false;

/** Desktop-width web: the LinkedIn-style top bar and side columns. Phones and the apps use bottom tabs. */
export function useIsWide() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
