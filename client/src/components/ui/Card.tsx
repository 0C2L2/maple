import { View, type ViewProps } from 'react-native';

export function Card({ children, ...props }: Omit<ViewProps, 'className'>) {
  return (
    <View {...props} className="w-full rounded-card border border-light-border bg-light-surface p-lg dark:border-dark-border dark:bg-dark-surface">
      {children}
    </View>
  );
}
