// Story 8: Reminders tab. Students see their upcoming reminders. Staff make reminders for
// their students (by email) and can delete them.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { Card, EmptyState, Icon, IconButton, icons, ReadAloudButton, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { deleteReminder, listReminders, type Reminder } from '@/lib/api';
import { formatDayTime } from '@/lib/time';

// Best practices:
// - Store times as ISO timestamps (timestamptz in the database) and format them
//   only for display. That keeps time zones correct across devices.
// - The database decides who can see or delete a reminder (row-level security):
//   staff manage reminders they made, students can only read theirs. The role
//   checks here only shape the UI to match.
// - When notifications are added, schedule and cancel them in the same place
//   reminders are added and removed, so the two never get out of sync.
export default function RemindersScreen() {
  const { role } = useSession();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');
  const staff = role === 'staff';

  // Reload each time the tab is opened, including when the New reminder form closes
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  const load = useCallback(() => {
    listReminders()
      .then((r) => {
        setReminders(r);
        setLoaded(true);
      })
      .catch((e) => setStatus('Could not load reminders: ' + (e as Error).message));
  }, []);
  useFocusEffect(load);

  // Compare Date objects, not formatted strings. Formatted text depends on locale.
  // listReminders only returns upcoming reminders, soonest first.
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const today = reminders.filter((r) => new Date(r.remind_at) <= endOfToday);
  const later = reminders.filter((r) => new Date(r.remind_at) > endOfToday);

  // Confirm destructive actions and mark the button 'destructive' so iOS shows it
  // in red. There is no undo yet.
  const confirmDelete = (r: Reminder) =>
    Alert.alert('Delete reminder?', r.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReminder(r.id);
            load();
          } catch (e) {
            setStatus('Could not delete: ' + (e as Error).message);
          }
        },
      },
    ]);

  const row = (r: Reminder) => (
    <Card key={r.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Icon name={icons.bell} size={26} color="warning" />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyBold">{r.title}</T>
          <T color="textSecondary">{formatDayTime(r.remind_at)}</T>
          {staff ? (
            <T variant="caption" color="textSecondary">
              For {r.student_email}
            </T>
          ) : null}
        </View>
        {/* Icon-only buttons need a label that names the item, so a screen reader
            says "Delete Practice flashcards" rather than just "button". */}
        {staff ? <IconButton icon={icons.trash} kind="danger" label={`Delete ${r.title}`} onPress={() => confirmDelete(r)} /> : null}
      </View>
    </Card>
  );

  return (
    <Screen
      tab
      title="Reminders"
      subtitle={staff ? 'Reminders for your students.' : 'Things to do, and when.'}
      // reminder-new is registered as a modal in the root layout
      right={
        staff ? <IconButton icon={icons.plus} kind="primary" label="New reminder" onPress={() => router.push('/reminder-new')} /> : null
      }>
      {!!status && <T color="danger">{status}</T>}

      {!staff && reminders.length > 0 ? (
        <ReadAloudButton text={reminders.map((r) => `${formatDayTime(r.remind_at)}: ${r.title}.`).join(' ')} />
      ) : null}

      {loaded && reminders.length === 0 ? (
        <EmptyState
          icon={icons.bell}
          title="No reminders"
          message={staff ? 'Press + to add one for a student.' : 'Your support staff can add reminders for you.'}
        />
      ) : null}
      {today.length ? <Section title="Today">{today.map(row)}</Section> : null}
      {later.length ? <Section title="Coming up">{later.map(row)}</Section> : null}
    </Screen>
  );
}
