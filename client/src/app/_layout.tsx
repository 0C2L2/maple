import '../../global.css';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider } from '@/providers/SessionProvider';
export default function RootLayout() {
  return <SafeAreaProvider><SessionProvider><StatusBar style="auto" /><Slot /></SessionProvider></SafeAreaProvider>;
}
