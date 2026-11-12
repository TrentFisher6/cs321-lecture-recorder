import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useSession } from '@/ctx';

// Staff: Home, Record, Reminders, Profile. Students: Home, Study, Reminders, Profile.
// Development builds also show the API tests tab.
//
// Best practices:
// - Native tabs (iOS UITabBar / Android bottom navigation) feel right on each
//   platform. The web version is app-tabs.web.tsx; Metro picks by file extension.
// - Every route file in src/app/(app)/ needs a Trigger here, even hidden ones.
// - Changing `hidden` remounts the navigator, so the role comes from the session
//   (loaded once per sign-in) and the tabs wait for it instead of changing later.
// - Hiding a tab is a UI choice, not security. A hidden route can still be opened by
//   a deep link, so data rules must live in the database's row-level security.
// - Keep it to five tabs or fewer. Android shows at most five.
// - Give every icon an sf (iOS) and md (Android) name, with filled versions for
//   the selected state.
// System icons from https://docs.expo.dev/router/advanced/native-tabs/ -Trent
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { role } = useSession();

  // Only reached right after signing in; on launch the splash screen covers this
  if (!role) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} accessibilityLabel="Loading" />
      </View>
    );
  }
  const staff = role === 'staff';

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.primarySoft}
      tintColor={colors.primary}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="record" hidden={!staff}>
        <NativeTabs.Trigger.Label>Record</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'mic', selected: 'mic.fill' }} md="mic" />
      </NativeTabs.Trigger>

      {/* Students review their due flashcards here. Staff see cards on each lecture. */}
      <NativeTabs.Trigger name="flashcards" hidden={staff}>
        <NativeTabs.Trigger.Label>Study</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }} md="style" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="reminders">
        <NativeTabs.Trigger.Label>Reminders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'bell', selected: 'bell.fill' }} md="notifications" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="account_circle" />
      </NativeTabs.Trigger>

      {/* Recording pipeline test page. __DEV__ is true only in development builds. */}
      <NativeTabs.Trigger name="explore" hidden={!__DEV__}>
        <NativeTabs.Trigger.Label>API tests</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver" md="build" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
