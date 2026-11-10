import { SessionProvider, useSession } from '@/ctx';
import { SplashScreenController } from '@/splash';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
// Need to add future demos.

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
        {/* The course name is passed in when the course is opened (see the Courses screen) 
        fallback to "Course" on error */}
        <Stack.Screen name="course/[id]" options={({ route }) => ({ title: (route.params as { name?: string })?.name ?? 'Course' })} />
        <Stack.Screen name="lecture/[id]" options={({ route }) => ({ title: (route.params as { name?: string })?.name ?? 'Lecture' })} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  )
}