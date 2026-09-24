// iOS/Android: Expo's SQLite-backed localStorage keeps you signed in across app launches.
import 'expo-sqlite/localStorage/install';

export const sessionStorageAdapter = localStorage;
