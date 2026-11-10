// Courses screen
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { createCourse, inviteStudent, listCourses, myRole, type Course } from '@/lib/api';

export default function CoursesScreen() {
  const { signOut } = useSession();
  const theme = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState('');
  const [status, setStatus] = useState('');

  // Load the role and courses when the screen opens
  useEffect(() => {
    myRole().then(setRole);
    listCourses().then(setCourses);
  }, []);

  async function addCourse() {
    try {
      await createCourse(courseName.trim());
      setCourseName('');
      setCourses(await listCourses());
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
  }

  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* setting this to handled lets buttons work while the keyboard is open
            From https://reactnative.dev/docs/scrollview#keyboardshouldpersisttaps -Trent */}
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <ThemedText type="subtitle">Courses</ThemedText>
            <Button title="Log out" color={theme.primary} onPress={signOut} />
          </View>

          {role === 'staff' && (
            <View style={styles.row}>
              <TextInput
                style={[inputStyle, styles.grow]}
                placeholder="New course name"
                placeholderTextColor={theme.textSecondary}
                value={courseName}
                onChangeText={setCourseName}
              />
              <Button title="Create" color={theme.primary} onPress={addCourse} />
            </View>
          )}

          {courses.map((course) => (
            <CourseCard key={course.id} course={course} isStaff={role === 'staff'} onStatus={setStatus} />
          ))}

          {role && courses.length === 0 && (
            <ThemedText themeColor="textSecondary">
              {role === 'staff' ? 'Create your first course above.' : 'No courses. Ask your support staff to invite you.'}
            </ThemedText>
          )}

          {!!status && <ThemedText type="small">{status}</ThemedText>}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

// This is a single course. Staff get an invite box under the name
function CourseCard({ course, isStaff, onStatus }: { course: Course; isStaff: boolean; onStatus: (text: string) => void }) {
  const theme = useTheme();
  const [email, setEmail] = useState('');

  async function invite() {
    try {
      await inviteStudent(course.id, email);
      setEmail('');
      onStatus(`Invited ${email} to ${course.name}`);
    } catch (e) {
      onStatus('Failed: ' + (e as Error).message);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {/* Tap on a course button to open the course screen. From https://docs.expo.dev/router/basics/navigation/ -Trent */}
      <Pressable
        style={styles.header}
        onPress={() => router.push({ pathname: '/course/[id]', params: { id: course.id, name: course.name } })}>
        <ThemedText type="smallBold">{course.name}</ThemedText>
        <ThemedText themeColor="primary">Open ›</ThemedText>
      </Pressable>
      {isStaff && (
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.grow, { borderColor: theme.border, color: theme.text }]}
            placeholder="Student email"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Button title="Invite" color={theme.primary} onPress={invite} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.three },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  grow: { flex: 1 },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
});
