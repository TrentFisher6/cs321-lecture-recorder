import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Icon, icons, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useDemo } from '@/demo-store';
import { useTheme } from '@/hooks/use-theme';
import { people } from '@/lib/mock-data';

// Profile tab. Shared by staff and students.
//
// Best practices:
// - The role should come from the signed-in user's row in the profiles table,
//   not from local state. Never let the app pick its own role in production,
//   because the role decides what data a user can see.
// - Profile is shown for both roles on purpose. Changing the role remounts the tab
//   navigator, and staying on a shared tab avoids landing on a hidden one.
export default function ProfileScreen() {
  const theme = useTheme();
  const { signOut } = useSession();
  const { role, setRole } = useDemo();
  const staff = role === 'staff';
  const me = staff ? people.staff : people.student;

  return (
    <Screen tab title="Profile">
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <T variant="heading" color="onPrimary">
            {me.name
              .split(' ')
              .map((p) => p[0])
              .join('')}
          </T>
        </View>
        <View style={{ flex: 1, gap: Spacing.one }}>
          <T variant="heading">{me.name}</T>
          <Badge tone="primary" label={staff ? 'Support staff' : 'Student'} />
        </View>
      </Card>

      {staff ? (
        <Section title="Students you support">
          {people.supportedStudents.map((name) => (
            <Card key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
              <Icon name={icons.person} size={24} color="textSecondary" />
              <T variant="bodyBold">{name}</T>
            </Card>
          ))}
        </Section>
      ) : (
        <Section title="Your support person">
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Icon name={icons.person} size={24} color="textSecondary" />
            <T variant="bodyBold">{people.staff.name}</T>
          </Card>
        </Section>
      )}

      {/* Demo only. Remove this section before a real release, or show it only
          in development builds with `if (__DEV__)`. */}
      <Section title="Demo">
        <T color="textSecondary">Switch views to see what the other kind of user sees.</T>
        <Button
          kind="secondary"
          label={staff ? 'Switch to student view' : 'Switch to staff view'}
          onPress={() => setRole(staff ? 'student' : 'staff')}
        />
      </Section>

      {/* Do not navigate after sign-out. Clearing the session is enough, because the
          Stack.Protected guard in the root layout then shows the sign-in screen. */}
      <Button kind="danger" label="Sign out" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
