import Head from 'expo-router/head';
import { Image, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { theme } from '@/constants/theme';

export default function Index() {
  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-dark-background">
      <Head><title>Maple — Foundation Build</title><meta name="description" content="Maple shared client foundation — Checkpoint 1." /></Head>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg }}>
        <View className="w-full max-w-xl self-center items-center gap-xl py-xl">
          <View className="items-center gap-md">
            <Image
              source={require('../../assets/images/maple-leaf-source.jpg')}
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no"
              resizeMode="contain"
              style={{ width: theme.spacing["2xl"] * 2, height: theme.spacing["2xl"] * 2, borderRadius: theme.radius.card }}
            />
            <Text className="text-sm font-bold tracking-[4px] text-light-text dark:text-dark-text">MAPLE</Text>
          </View>
          <View className="items-center gap-md">
            <Text accessibilityRole="header" className="text-center text-3xl sm:text-4xl font-semibold leading-tight text-light-text dark:text-dark-text">
              Where events and sponsors find each other.
            </Text>
            <Text className="max-w-md text-center text-base leading-7 text-light-muted dark:text-dark-muted">
              Professional sponsorship discovery{ '\n' }for event organizers and brands.
            </Text>
          </View>
          <View className="flex-row flex-wrap justify-center gap-md">
            <Button label="Organizer" accessibilityHint="Foundation preview only; no navigation." />
            <Button label="Sponsor" variant="secondary" accessibilityHint="Foundation preview only; no navigation." />
          </View>
          <Card>
            <View className="items-center gap-xs">
              <Text className="text-sm font-semibold text-light-text dark:text-dark-text">Foundation Build</Text>
              <Text className="text-sm text-light-muted dark:text-dark-muted">Checkpoint 1</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}



