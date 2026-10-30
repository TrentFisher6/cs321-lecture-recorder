import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Checkbox, EmptyState, Icon, icons, ReadAloudButton, Screen, Section, Segmented, T } from '@/components/kit';
import { lectureBadge } from '@/components/lecture-row';
import { Spacing } from '@/constants/theme';
import { useDemo } from '@/demo-store';
import { useTheme } from '@/hooks/use-theme';
import { courses, flashcards, formatClock, formatDate, type Lecture } from '@/lib/mock-data';

type TabKey = 'notes' | 'transcript' | 'plan';

// Stories 6 and 9: notes, transcript, and study plan for one lecture.
// Staff review and verify. Students only reach verified lectures.
export default function LectureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role, lectures, setVerified } = useDemo();
  const [tab, setTab] = useState<TabKey>('notes');
  const lecture = lectures.find((l) => l.id === id);
  const staff = role === 'staff';

  if (!lecture) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Lecture' }} />
        <EmptyState icon={icons.warning} title="Lecture not found" message="It may have been deleted." />
      </Screen>
    );
  }

  const course = courses.find((c) => c.id === lecture.courseId);
  const cardCount = flashcards.filter((f) => f.lectureId === lecture.id).length;
  const ready = lecture.status === 'ready';

  const options: { key: TabKey; label: string }[] = staff
    ? [
        { key: 'notes', label: 'Notes' },
        { key: 'transcript', label: 'Transcript' },
        { key: 'plan', label: 'Study plan' },
      ]
    : [
        { key: 'notes', label: 'Notes' },
        { key: 'plan', label: 'Study plan' },
      ];

  const verify = () =>
    Alert.alert('Mark as verified?', 'Your student will be able to see these notes and flashcards.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Verify', onPress: () => setVerified(lecture.id, true) },
    ]);

  const footer =
    staff && ready ? (
      lecture.verified ? (
        <View style={styles.footerRow}>
          <Icon name={icons.check} size={22} color="success" />
          <T variant="bodyBold" color="success" style={{ flex: 1 }}>
            Verified. Your student can see this.
          </T>
          <Button kind="secondary" label="Undo" onPress={() => setVerified(lecture.id, false)} />
        </View>
      ) : (
        <Button icon={icons.check} label="Mark as verified" onPress={verify} />
      )
    ) : undefined;

  return (
    <Screen footer={footer}>
      <Stack.Screen options={{ title: course?.code ?? 'Lecture' }} />

      <View style={{ gap: Spacing.one }}>
        <T variant="title" accessibilityRole="header">
          {lecture.title}
        </T>
        <T color="textSecondary">
          {formatDate(lecture.date)} · {lecture.durationMin} min
        </T>
        {staff ? lectureBadge(lecture) : null}
      </View>

      {!ready ? (
        <EmptyState icon={icons.sparkles} title="Making notes…" message="This usually takes a few minutes. Check back soon." />
      ) : (
        <>
          <Segmented options={options} value={tab} onChange={setTab} />
          {tab === 'notes' ? <NotesTab lecture={lecture} staff={staff} /> : null}
          {tab === 'transcript' ? <TranscriptTab lecture={lecture} /> : null}
          {tab === 'plan' ? <PlanTab lecture={lecture} staff={staff} /> : null}

          <View style={styles.actions}>
            {cardCount > 0 ? (
              <Button
                kind="secondary"
                icon={icons.cards}
                label={`Practice ${cardCount} flashcards`}
                onPress={() => router.push({ pathname: '/flashcards/[lectureId]', params: { lectureId: lecture.id } })}
              />
            ) : null}
            <Button
              kind="secondary"
              icon={icons.bell}
              label="Add a reminder"
              onPress={() => router.push({ pathname: '/reminder-new', params: { lectureId: lecture.id } })}
            />
          </View>
        </>
      )}
    </Screen>
  );
}

function NotesTab({ lecture, staff }: { lecture: Lecture; staff: boolean }) {
  const notes = lecture.notes;
  if (!notes) return null;
  const readText = [notes.summary, ...notes.keyPoints, ...notes.terms.map((t) => `${t.term}: ${t.meaning}`)].join('. ');

  return (
    <>
      {staff && !lecture.verified ? <AiHint text="Made by AI from the transcript. Check it before verifying." /> : null}
      <ReadAloudButton text={readText} />

      <Section title="Summary">
        <Card>
          <T>{notes.summary}</T>
        </Card>
      </Section>

      <Section title="Key points">
        <Card>
          {notes.keyPoints.map((p, i) => (
            <View key={i} style={styles.point}>
              <NumberDot n={i + 1} />
              <T style={{ flex: 1 }}>{p}</T>
            </View>
          ))}
        </Card>
      </Section>

      <Section title="Words to know">
        {notes.terms.map((t) => (
          <Card key={t.term} tone="primarySoft">
            <T variant="bodyBold" color="primary">
              {t.term}
            </T>
            <T>{t.meaning}</T>
          </Card>
        ))}
      </Section>
    </>
  );
}

function TranscriptTab({ lecture }: { lecture: Lecture }) {
  return (
    <>
      <AiHint text="Check names and new words. Fixing lines comes in a later version." />
      <Card>
        {lecture.transcript.map((line, i) => (
          <View key={i} style={{ gap: Spacing.half, paddingVertical: Spacing.one }}>
            <T variant="caption" color="textSecondary">
              {formatClock(line.start)} · {line.speaker}
            </T>
            <T>{line.text}</T>
          </View>
        ))}
      </Card>
    </>
  );
}

function PlanTab({ lecture, staff }: { lecture: Lecture; staff: boolean }) {
  const { toggleStep } = useDemo();
  return (
    <>
      {staff ? <AiHint text="Suggested plan for working with your student outside class." /> : null}
      {lecture.studyPlan.map((section) => {
        const done = section.steps.filter((s) => s.done).length;
        return (
          <Section key={section.id} title={section.title} action={<T color="textSecondary">{`${done}/${section.steps.length}`}</T>}>
            <Card>
              {section.steps.map((s) => (
                <Checkbox key={s.id} label={s.text} checked={s.done} onPress={() => toggleStep(lecture.id, s.id)} />
              ))}
            </Card>
          </Section>
        );
      })}
    </>
  );
}

function AiHint({ text }: { text: string }) {
  return (
    <Card tone="warningSoft" style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
      <Icon name={icons.sparkles} size={20} color="warning" />
      <T variant="caption" color="warning" style={{ flex: 1 }}>
        {text}
      </T>
    </Card>
  );
}

function NumberDot({ n }: { n: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.dot, { backgroundColor: theme.primary }]}>
      <T variant="caption" color="onPrimary" style={{ fontWeight: '700' }}>
        {n}
      </T>
    </View>
  );
}

const styles = StyleSheet.create({
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  actions: { gap: Spacing.two },
  point: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start', paddingVertical: Spacing.one },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
