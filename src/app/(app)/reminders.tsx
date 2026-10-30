import { router } from 'expo-router';
import { Alert, View } from 'react-native';

import { Card, EmptyState, Icon, IconButton, icons, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useDemo, useVisibleReminders } from '@/demo-store';
import { formatDayTime, people, type Reminder } from '@/lib/mock-data';

// Story 8: staff make reminders for students, and students can set their own.
export default function RemindersScreen() {
  const { role, removeReminder } = useDemo();
  const all = useVisibleReminders();
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const upcoming = all.filter((r) => new Date(r.remindAt) >= now);
  const today = upcoming.filter((r) => new Date(r.remindAt) <= endOfToday);
  const later = upcoming.filter((r) => new Date(r.remindAt) > endOfToday);

  const confirmDelete = (r: Reminder) =>
    Alert.alert('Delete reminder?', r.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeReminder(r.id) },
    ]);

  const row = (r: Reminder) => (
    <Card key={r.id}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <Icon name={icons.bell} size={26} color="warning" />
        <View style={{ flex: 1, gap: 2 }}>
          <T variant="bodyBold">{r.title}</T>
          <T color="textSecondary">{formatDayTime(r.remindAt)}</T>
          <T variant="caption" color="textSecondary">
            {role === 'staff'
              ? `For ${r.studentName}${r.createdBy === 'student' ? ' · set by student' : ''}`
              : r.createdBy === 'staff'
                ? `From ${people.staff.name.split(' ')[0]}`
                : 'You set this'}
          </T>
        </View>
        <IconButton icon={icons.trash} kind="danger" label={`Delete ${r.title}`} onPress={() => confirmDelete(r)} />
      </View>
    </Card>
  );

  return (
    <Screen
      tab
      title="Reminders"
      subtitle={role === 'staff' ? 'Reminders for your students.' : 'We will remind you on your phone.'}
      right={<IconButton icon={icons.plus} kind="primary" label="New reminder" onPress={() => router.push('/reminder-new')} />}>
      {upcoming.length === 0 ? (
        <EmptyState icon={icons.bell} title="No reminders" message="Press + to add one." />
      ) : null}
      {today.length ? <Section title="Today">{today.map(row)}</Section> : null}
      {later.length ? <Section title="Coming up">{later.map(row)}</Section> : null}
    </Screen>
  );
}
