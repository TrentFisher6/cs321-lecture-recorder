// Reminders tab. Students see their upcoming reminders and staff can create reminders for their students by email
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ReadAloud from '@/components/read-aloud';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  createReminder,
  deleteReminder,
  listInvitedStudents,
  listReminders,
  myRole,
  type Reminder,
} from '@/lib/api';
import { parseReminderTime } from '@/lib/time';

export default function RemindersScreen() {
  const theme = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [students, setStudents] = useState<string[]>([]);
  const [studentEmail, setStudentEmail] = useState('');
  const [title, setTitle] = useState('');
  const [when, setWhen] = useState('');
  const [status, setStatus] = useState('');

  // Reload each time the tab is opened so new students and reminders show up
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  useFocusEffect(
    useCallback(() => {
      myRole().then(setRole);
      listReminders().then(setReminders);
      listInvitedStudents().then(setStudents);
    }, []),
  );

  async function add() {
    const remindAt = parseReminderTime(when);
    if (!studentEmail || !title.trim() || !remindAt) {
      setStatus('Set a student and title, and use a time like 2026-11-20 14:00');
      return;
    }
    try {
      await createReminder(studentEmail, title.trim(), remindAt);
      setTitle('');
      setWhen('');
      setStatus('Reminder added');
      setReminders(await listReminders());
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
  }

  async function remove(id: string) {
    try {
      await deleteReminder(id);
      setReminders(await listReminders());
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
  }

  const isStaff = role === 'staff';
  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text }];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="subtitle">Reminders</ThemedText>

          {isStaff && (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">New reminder</ThemedText>
              {/* Tap a student to pick them */}
              <View style={styles.row}>
                {students.map((email) => (
                  <Pressable key={email} onPress={() => setStudentEmail(email)}>
                    <ThemedView type={email === studentEmail ? 'primarySoft' : 'background'} style={styles.chip}>
                      <ThemedText type="small" themeColor={email === studentEmail ? 'primary' : 'text'}>
                        {email}
                      </ThemedText>
                    </ThemedView>
                  </Pressable>
                ))}
              </View>
              <TextInput
                style={inputStyle}
                placeholder="Reminder title"
                placeholderTextColor={theme.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
              <TextInput
                style={inputStyle}
                placeholder="A date  like 2026-11-20 14:00"
                placeholderTextColor={theme.textSecondary}
                value={when}
                onChangeText={setWhen}
              />
              <Button title="Add reminder" color={theme.primary} onPress={add} />
              {!!status && <ThemedText type="small">{status}</ThemedText>}
            </ThemedView>
          )}

          <ThemedText type="smallBold">Upcoming</ThemedText>
          {reminders.length > 0 && (
            <ReadAloud
              text={reminders.map((r) => `${new Date(r.remind_at).toLocaleString()}: ${r.title}.`).join(' ')}
            />
          )}
          {reminders.map((reminder) => (
            <ThemedView key={reminder.id} type="backgroundElement" style={[styles.card, styles.reminder]}>
              <View style={styles.grow}>
                <ThemedText type="smallBold">{reminder.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {new Date(reminder.remind_at).toLocaleString()}
                  {isStaff ? ` · ${reminder.student_email}` : ''}
                </ThemedText>
              </View>
              {isStaff && <Button title="Delete" color={theme.danger} onPress={() => remove(reminder.id)} />}
            </ThemedView>
          ))}
          {role && reminders.length === 0 && (
            <ThemedText themeColor="textSecondary">No upcoming reminders.</ThemedText>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  safeArea: { flex: 1, maxWidth: MaxContentWidth },
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: BottomTabInset + Spacing.three },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  reminder: { flexDirection: 'row', alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  grow: { flex: 1 },
  chip: { borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
});
