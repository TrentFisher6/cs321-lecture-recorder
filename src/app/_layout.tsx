import { SessionProvider, useSession } from '@/ctx';
import { DemoProvider } from '@/demo-store';
import { SplashScreenController } from '@/splash';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import 'react-native-url-polyfill/auto';

// Taken from https://docs.expo.dev/router/advanced/authentication/ -Trent

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <SessionProvider>
      <DemoProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <SplashScreenController />
          <RootNavigator />
        </ThemeProvider>
      </DemoProvider>
    </SessionProvider>
  );
}

// Show the sign in screen when the user doesnt have an active session
function RootNavigator() {
  const { session } = useSession();
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* Detail screens push on top of the tabs. */}
        <Stack.Screen name="course/[id]" />
        <Stack.Screen name="lecture/[id]" />
        <Stack.Screen name="flashcards/[lectureId]" options={{ title: 'Practice' }} />
        <Stack.Screen name="reminder-new" options={{ presentation: 'modal', title: 'New reminder' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  )
}
