import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Chip, Screen, Section } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useDemo } from '@/demo-store';
import { useTheme } from '@/hooks/use-theme';
import { people } from '@/lib/mock-data';

// Story 8: quick reminder form. Preset times instead of a date picker keep it simple
// for students. Push notifications get scheduled here once expo-notifications is added.
function timeChoices() {
  const make = (label: string, days: number, hour: number, minute = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return { label, iso: d.toISOString() };
  };
  const inAnHour = new Date(Date.now() + 60 * 60 * 1000);
  inAnHour.setSeconds(0, 0);
  const saturday = (6 - new Date().getDay() + 7) % 7 || 7;
  return [
    { label: 'In 1 hour', iso: inAnHour.toISOString() },
    make('Tonight 7 PM', 0, 19),
    make('Tomorrow 4 PM', 1, 16),
    make('Saturday 10 AM', saturday, 10),
  ].filter((c) => new Date(c.iso) > new Date());
}

export default function NewReminderScreen() {
  const theme = useTheme();
  const { role, lectures, addReminder } = useDemo();
  const { lectureId } = useLocalSearchParams<{ lectureId?: string }>();
  const lecture = lectures.find((l) => l.id === lectureId);
  const staff = role === 'staff';

  const [title, setTitle] = useState(lecture ? `Review: ${lecture.title}` : '');
  const [when, setWhen] = useState<string | null>(null);
  const [student, setStudent] = useState(people.supportedStudents[0]);
  const [choices] = useState(timeChoices);

  const save = () => {
    if (!title.trim() || !when) return;
    addReminder({
      title: title.trim(),
      remindAt: when,
      studentName: staff ? student : people.student.name,
      createdBy: role,
    });
    router.back();
  };

  return (
    <Screen footer={<Button label="Save reminder" onPress={save} disabled={!title.trim() || !when} />}>
      {staff ? (
        <Section title="For">
          <View style={styles.wrap}>
            {people.supportedStudents.map((name) => (
              <Chip key={name} label={name} selected={name === student} onPress={() => setStudent(name)} />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="What to do?">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Practice flashcards"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="What to do"
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
        />
        <View style={styles.wrap}>
          {['Review notes', 'Practice flashcards', 'Do homework'].map((s) => (
            <Chip key={s} label={s} selected={title === s} onPress={() => setTitle(s)} />
          ))}
        </View>
      </Section>

      <Section title="When?">
        <View style={styles.wrap}>
          {choices.map((c) => (
            <Chip key={c.label} label={c.label} selected={when === c.iso} onPress={() => setWhen(c.iso)} />
          ))}
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: { minHeight: 56, borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.three, fontSize: 18 },
});
