import type { PropsWithChildren } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui/Card';
import { theme } from '@/constants/theme';

export function AuthFrame({ title, children }: PropsWithChildren<{ title: string }>) {
  return <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background">
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg }}>
      <View className="w-full max-w-md self-center gap-lg py-xl">
        <Text className="text-sm font-bold tracking-[4px] text-light-text dark:text-dark-text">MAPLE</Text>
        <Card><View className="gap-lg">
          <Text accessibilityRole="header" className="text-2xl font-semibold text-light-text dark:text-dark-text">{title}</Text>
          {children}
        </View></Card>
      </View>
    </ScrollView>
  </SafeAreaView>;
}
export function AuthError({ message }: { message: string | null }) {
  return message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className="text-sm leading-6 text-light-text dark:text-dark-text">{message}</Text> : null;
}
