import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Icon, icons, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useDemo } from '@/demo-store';
import { useTheme } from '@/hooks/use-theme';
import { people } from '@/lib/mock-data';

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

      <Section title="Demo">
        <T color="textSecondary">Switch views to see what the other kind of user sees.</T>
        <Button
          kind="secondary"
          label={staff ? 'Switch to student view' : 'Switch to staff view'}
          onPress={() => setRole(staff ? 'student' : 'staff')}
        />
      </Section>

      {/* The Stack.Protected guard in the root layout sends the user to sign-in. */}
      <Button kind="danger" label="Sign out" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
