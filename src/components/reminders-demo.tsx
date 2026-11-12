// Demo of reminders. Staff pick an invited student and make a reminder, students see their upcoming reminders
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import ReadAloud from '@/components/read-aloud';
import {
  createReminder,
  deleteReminder,
  listInvitedStudents,
  listReminders,
  myRole,
  type Reminder,
} from '@/lib/api';
import { parseReminderTime } from '@/lib/time';

export default function RemindersDemo() {
  const [role, setRole] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [status, setStatus] = useState('');

  // Load everything once when the screen opens
  useEffect(() => {
    myRole().then(setRole);
    listReminders().then(setReminders);
    listInvitedStudents().then(setStudents);
  }, []);

  async function add() {
    const remindAt = parseReminderTime(when);
    if (!studentEmail || !title || !remindAt) {
      setStatus('Pick a student and use a time like 2026-11-20 14:00');
      return;
    }
    try {
      await createReminder(studentEmail, title, remindAt);
      setTitle('');
      setWhen('');
      setStatus('Reminder added');
      setReminders(await listReminders());
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  async function remove(id: string) {
    try {
      await deleteReminder(id);
      setReminders(await listReminders());
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  if (!role) return null;

  return (
    <View style={styles.box}>
      <Text style={styles.bold}>Reminders</Text>

      {role === 'staff' && (
        <>
          <Text>Student:</Text>
          {students.map((email) => (
            <Button
              key={email}
              title={email === studentEmail ? `${email} (selected)` : email}
              onPress={() => setStudentEmail(email)}
            />
          ))}
          <TextInput style={styles.input} placeholder="Title" value={title} onChangeText={setTitle} />
          <TextInput
            style={styles.input}
            placeholder="When, like 2026-11-20 14:00"
            value={when}
            onChangeText={setWhen}
          />
          <Button title="Add reminder" onPress={add} />
        </>
      )}

      {reminders.map((reminder) => (
        <View key={reminder.id} style={styles.row}>
          <Text style={styles.grow}>
            {new Date(reminder.remind_at).toLocaleString()}: {reminder.title}
            {role === 'staff' ? ` (${reminder.student_email})` : ''}
          </Text>
          {role === 'staff' && <Button title="Delete" onPress={() => remove(reminder.id)} />}
        </View>
      ))}
      {reminders.length === 0 && <Text>No upcoming reminders.</Text>}
      {reminders.length > 0 && (
        <ReadAloud
          text={reminders.map((r) => `${new Date(r.remind_at).toLocaleString()}: ${r.title}.`).join(' ')}
        />
      )}
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grow: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#86939e', borderRadius: 4, padding: 8 },
  bold: { fontWeight: '600' },
});
