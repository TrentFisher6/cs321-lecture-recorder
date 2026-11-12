import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Badge, Button, Card, EmptyState, Icon, icons, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { listCourses, listInvitedStudents } from '@/lib/api';

// Profile tab. Shared by staff and students.
//
// Best practices:
// - The role comes from the signed-in user's row in the profiles table (loaded once
//   in ctx.tsx), never from local state, because the role decides what data a user can see.
// - Profile is shown for both roles on purpose, so there is always a shared tab to land on.
export default function ProfileScreen() {
  const theme = useTheme();
  const { session, role, signOut } = useSession();
  const staff = role === 'staff';
  const email = session?.user.email ?? '';
  // Staff see the students they invited; students see the courses they are in
  const [people, setPeople] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');

  useFocusEffect(
    useCallback(() => {
      const load = staff ? listInvitedStudents() : listCourses().then((c) => c.map((course) => course.name));
      load
        .then((list) => {
          setPeople(list);
          setLoaded(true);
        })
        .catch((e) => setStatus('Could not load: ' + (e as Error).message));
    }, [staff]),
  );

  return (
    <Screen tab title="Profile">
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <T variant="heading" color="onPrimary">
            {(email[0] ?? '?').toUpperCase()}
          </T>
        </View>
        <View style={{ flex: 1, gap: Spacing.one }}>
          <T variant="bodyBold" numberOfLines={1}>
            {email}
          </T>
          <Badge tone="primary" label={staff ? 'Support staff' : 'Student'} />
        </View>
      </Card>

      {!!status && <T color="danger">{status}</T>}

      <Section title={staff ? 'Students you support' : 'Your courses'}>
        {loaded && people.length === 0 ? (
          <EmptyState
            icon={staff ? icons.person : icons.book}
            title={staff ? 'No students yet' : 'No courses yet'}
            message={staff ? 'Invite a student from a course on the Home tab.' : 'Ask your support staff to invite you.'}
          />
        ) : null}
        {people.map((name) => (
          <Card key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Icon name={staff ? icons.person : icons.school} size={24} color="textSecondary" />
            <T variant="bodyBold" style={{ flex: 1 }}>
              {name}
            </T>
          </Card>
        ))}
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
