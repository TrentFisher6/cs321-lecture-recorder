import { SessionProvider, useSession } from '@/ctx';
import { SplashScreenController } from '@/splash';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import 'react-native-url-polyfill/auto';

// Taken from https://docs.expo.dev/router/advanced/authentication/ -Trent

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <SessionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SplashScreenController />
        <RootNavigator />
      </ThemeProvider>
    </SessionProvider>
  );
}

// Show the sign in screen when the user doesnt have an active session
function RootNavigator() {
  const { session } = useSession();
  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  )
}