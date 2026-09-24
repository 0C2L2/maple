import type { ViewProps } from 'react-native';

/**
 * Opt a view into the web motion rules in src/global.css: `<View {...motion({ reveal: '' })} />`.
 * React Native Web renders `dataSet` as data-* attributes; the apps ignore it.
 */
export function motion(attributes: Record<string, string | number>) {
  return { dataSet: attributes } as ViewProps;
}
