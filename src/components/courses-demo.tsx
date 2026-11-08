// Demo of courses. Staff create courses and invite students by email, students see their courses.
// Inputs based on https://reactnative.dev/docs/textinput -Trent
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { createCourse, inviteStudent, listCourses, myRole, type Course } from '@/lib/api';

export default function CoursesDemo() {
  const [role, setRole] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  // Load the role and courses once when the screen opens
  useEffect(() => {
    myRole().then(setRole);
    listCourses().then(setCourses);
  }, []);

  async function addCourse() {
    try {
      await createCourse(courseName);
      setCourseName('');
      setCourses(await listCourses());
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  async function invite(course: Course) {
    try {
      await inviteStudent(course.id, email);
      setStatus(`Invited ${email} to ${course.name}`);
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  if (!role) return null;

  if (role === 'student') {
    return (
      <View style={styles.box}>
        <Text style={styles.bold}>My courses</Text>
        {courses.map((course) => (
          <Text key={course.id}>{course.name}</Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.bold}>My courses (staff)</Text>
      <TextInput style={styles.input} placeholder="New course name" value={courseName} onChangeText={setCourseName} />
      <Button title="Create course" onPress={addCourse} />
      <TextInput
        style={styles.input}
        placeholder="Student email to invite"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      {courses.map((course) => (
        <View key={course.id} style={styles.row}>
          <Text>{course.name}</Text>
          <Button title="Invite" onPress={() => invite(course)} />
        </View>
      ))}
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: { borderWidth: 1, borderColor: '#86939e', borderRadius: 4, padding: 8 },
  bold: { fontWeight: '600' },
});
