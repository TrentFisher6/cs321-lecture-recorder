import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';

// Web tab bar. Metro uses this file instead of app-tabs.tsx when building for web.
//
// Best practices:
// - Keep the tab list in sync with app-tabs.tsx. When you add or rename a tab
//   there, change it here too.
// - Built from expo-router/ui headless parts (Tabs, TabList, TabTrigger), so
//   we control the look while the router handles navigation and URLs.
// - On web, render only the tabs for the current role, not hidden ones. Each
//   TabTrigger becomes a real link.
export default function AppTabs() {
  const { role } = useSession();
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton>Home</TabButton>
          </TabTrigger>
          {role === 'staff' ? (
            <TabTrigger name="record" href="/record" asChild>
              <TabButton>Record</TabButton>
            </TabTrigger>
          ) : (
            <TabTrigger name="flashcards" href="/flashcards" asChild>
              <TabButton>Study</TabButton>
            </TabTrigger>
          )}
          <TabTrigger name="reminders" href="/reminders" asChild>
            <TabButton>Reminders</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton>Profile</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

// Spread the trigger props onto Pressable. They carry the press handler and
// accessibility state, so the button behaves like a real tab.
export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  return (
    <Pressable
      {...(props as React.ComponentPropsWithRef<typeof Pressable>)}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          Patriot Recall
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
