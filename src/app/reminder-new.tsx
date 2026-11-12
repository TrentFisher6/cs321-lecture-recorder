// Story 8: quick reminder form for staff. Preset times and titles instead of typing keep
// it simple. Push notifications get scheduled here once expo-notifications is added.
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, EmptyState, icons, Input, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { createReminder, listInvitedStudents } from '@/lib/api';
import { parseReminderTime } from '@/lib/time';

const TITLE_CHOICES = ['Review notes', 'Practice flashcards', 'Do homework'];

// Preset times from now. Past ones (e.g. "Tonight 7 PM" at 8 PM) are left out.
function timeChoices() {
  const make = (label: string, days: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return { label, iso: d.toISOString() };
  };
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  inAnHour.setSeconds(0, 0);
  const daysToSaturday = (6 - new Date().getDay() + 7) % 7 || 7;
  return [
    { label: 'In 1 hour', iso: inAnHour.toISOString() },
    make('Tonight 7 PM', 0, 19),
    make('Tomorrow 4 PM', 1, 16),
    make('Saturday 10 AM', daysToSaturday, 10),
  ].filter((c) => new Date(c.iso) > new Date());
}

export default function NewReminderScreen() {
  const { role } = useSession();
  // Opened from a lecture, the title comes prefilled ("Review: Memory and learning")
  const params = useLocalSearchParams<{ title?: string }>();
  const [students, setStudents] = useState<string[] | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [title, setTitle] = useState(params.title ?? '');
  const [presetTime, setPresetTime] = useState<string | null>(null);
  const [typedTime, setTypedTime] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  // Worked out once when the form opens, so the chips do not change while picking
  const [choices] = useState(timeChoices);

  useEffect(() => {
    listInvitedStudents()
      .then((list) => {
        setStudents(list);
        // With only one student there is nothing to pick
        if (list.length === 1) setStudent(list[0]);
      })
      .catch((e) => setStatus('Could not load students: ' + (e as Error).message));
  }, []);

  // A preset chip wins; otherwise read the typed time
  const remindAt = presetTime ? new Date(presetTime) : parseReminderTime(typedTime);
  const canSave = !!student && !!title.trim() && !!remindAt && !saving;

  async function save() {
    if (!student || !title.trim() || !remindAt) return;
    setSaving(true);
    try {
      await createReminder(student, title.trim(), remindAt);
      router.back();
    } catch (e) {
      setStatus('Could not save: ' + (e as Error).message);
      setSaving(false);
    }
  }

  // The database only lets staff create reminders; this matches it in the UI
  if (role !== 'staff') {
    return (
      <Screen>
        <EmptyState icon={icons.bell} title="Only support staff can add reminders" message="Ask your support person to add one for you." />
      </Screen>
    );
  }

  if (students && students.length === 0) {
    return (
      <Screen>
        <EmptyState icon={icons.person} title="No students yet" message="Invite a student from a course first, then add reminders for them." />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Save reminder" onPress={save} disabled={!canSave} />}>
      {!!status && <T color="danger">{status}</T>}

      <Section title="For">
        <View style={styles.wrap}>
          {(students ?? []).map((email) => (
            <Chip key={email} label={email} selected={email === student} onPress={() => setStudent(email)} />
          ))}
        </View>
      </Section>

      <Section title="What to do?">
        <Input placeholder="Practice flashcards" accessibilityLabel="What to do" value={title} onChangeText={setTitle} />
        <View style={styles.wrap}>
          {TITLE_CHOICES.map((s) => (
            <Chip key={s} label={s} selected={title === s} onPress={() => setTitle(s)} />
          ))}
        </View>
      </Section>

      <Section title="When?">
        <View style={styles.wrap}>
          {choices.map((c) => (
            <Chip
              key={c.label}
              label={c.label}
              selected={presetTime === c.iso}
              onPress={() => {
                setPresetTime(c.iso);
                setTypedTime('');
              }}
            />
          ))}
        </View>
        <Input
          label="Or type a time"
          placeholder="2026-11-20 14:00"
          value={typedTime}
          onChangeText={(text) => {
            setTypedTime(text);
            setPresetTime(null);
          }}
        />
        {typedTime && !presetTime && !remindAt ? (
          <T variant="caption" color="warning">
            Use a time like 2026-11-20 14:00
          </T>
        ) : null}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
