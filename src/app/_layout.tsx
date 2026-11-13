import { Colors } from '@/constants/theme';
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
    // GMU Green header (#006633) on pushed screens
    // From https://reactnavigation.org/docs/headers#adjusting-header-styles -Trent
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.light.primary },
        headerTintColor: Colors.light.onPrimary,
        headerBackButtonDisplayMode: 'minimal',
      }}>
      <Stack.Protected guard={!!session}>
        {/* Tab screens draw their own big title (kit Screen with `tab`), so the stack
            header would only repeat it */}
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* Detail screens push on top of the tabs. The name is passed in when the screen
            is opened (see LectureRow and the Home screen); fall back to a generic title */}
        <Stack.Screen name="course/[id]" options={({ route }) => ({ title: (route.params as { name?: string })?.name ?? 'Course' })} />
        <Stack.Screen name="lecture/[id]" options={({ route }) => ({ title: (route.params as { name?: string })?.name ?? 'Lecture' })} />
        {/* A short form that returns to where it was opened fits a modal better than a pushed screen */}
        <Stack.Screen name="reminder-new" options={{ presentation: 'modal', title: 'New reminder' }} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" options={{ title: 'Sign in' }} />
      </Stack.Protected>
    </Stack>
  )
}