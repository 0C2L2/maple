import {View} from 'react-native';
import {MarketplaceHeader} from '@/components/marketplace/MarketplaceHeader';
import '../../global.css';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/providers/SessionProvider';
export default function RootLayout() {
  return <SafeAreaProvider><SessionProvider><StatusBar style="auto" /><View className="flex-1"><MarketplaceHeader/><View className="flex-1"><Slot /></View></View></SessionProvider></SafeAreaProvider>;
}
