// Stories 6 and 9: notes, to-dos, study plan, flashcards, and transcript for one lecture.
// The staff member who owns it can edit it and mark it verified. Students only reach
// verified lectures (the database rules hide the rest).
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Icon, icons, ReadAloudButton, Screen, Section, Segmented, T } from '@/components/kit';
import LectureEditor from '@/components/lecture-editor';
import { lectureBadge } from '@/components/lecture-row';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { getLecture, updateLecture, type Lecture, type Notes, type StudyPlan, type TranscriptLine } from '@/lib/api';
import { formatDate, formatDuration } from '@/lib/time';

type TabKey = 'notes' | 'plan' | 'transcript';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'notes', label: 'Notes' },
  { key: 'plan', label: 'Study plan' },
  { key: 'transcript', label: 'Transcript' },
];

export default function LectureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, role } = useSession();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<TabKey>('notes');
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');

  async function load() {
    try {
      setLecture(await getLecture(id));
    } catch {
      // .single() throws when no row comes back: deleted, or not visible to this user
      setMissing(true);
    }
  }

  // Load the lecture when the screen opens
  useEffect(() => {
    getLecture(id)
      .then(setLecture)
      .catch(() => setMissing(true));
  }, [id]);

  async function setVerified(verified: boolean) {
    if (!lecture) return;
    try {
      await updateLecture(lecture.id, { verified });
      await load();
    } catch (e) {
      setStatus('Could not save: ' + (e as Error).message);
    }
  }

  if (missing) {
    return (
      <Screen>
        <EmptyState icon={icons.warning} title="Lecture not found" message="It may have been deleted." />
      </Screen>
    );
  }
  if (!lecture) return <Screen />;

  const isOwner = session?.user.id === lecture.owner_id;
  const staff = role === 'staff';
  const notes = lecture.notes as Notes | null;
  const ready = lecture.status === 'ready' && !!notes;

  // Confirm before showing notes to students. "Not yet" is listed first so it is the safe default.
  const verify = () =>
    Alert.alert('Mark as verified?', 'Your student will be able to see these notes and flashcards.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Verify', onPress: () => setVerified(true) },
    ]);

  // The main actions stay pinned at the bottom, so they are reachable without scrolling
  const footer =
    isOwner && ready && !editing ? (
      lecture.verified ? (
        <View style={styles.footerRow}>
          <Icon name={icons.check} size={22} color="success" />
          <T variant="bodyBold" color="success" style={{ flex: 1 }}>
            Verified. Your student can see this.
          </T>
          <Button kind="secondary" label="Undo" onPress={() => setVerified(false)} />
        </View>
      ) : (
        <View style={styles.footerRow}>
          <Button kind="secondary" label="Edit" onPress={() => setEditing(true)} style={{ flex: 1 }} />
          <Button icon={icons.check} label="Mark as verified" onPress={verify} style={{ flex: 2 }} />
        </View>
      )
    ) : undefined;

  return (
    <Screen footer={footer}>
      <View style={{ gap: Spacing.one }}>
        <T variant="title" accessibilityRole="header">
          {lecture.title ?? 'Lecture'}
        </T>
        {lecture.date ? <T color="textSecondary">{formatDate(lecture.date)}</T> : null}
        {staff ? lectureBadge(lecture) : null}
      </View>

      {!!status && <T color="danger">{status}</T>}

      {lecture.status === 'error' ? (
        <EmptyState icon={icons.warning} title="Something went wrong" message="The notes could not be made. Try recording or uploading again." />
      ) : !ready ? (
        <EmptyState icon={icons.sparkles} title="Making notes…" message="This usually takes a few minutes. Check back soon." />
      ) : editing ? (
        <>
          <LectureEditor
            lecture={lecture}
            onSaved={() => {
              setEditing(false);
              load();
            }}
          />
          <Button kind="secondary" label="Cancel editing" onPress={() => setEditing(false)} />
        </>
      ) : (
        <>
          <Segmented options={TABS} value={tab} onChange={setTab} />
          {tab === 'notes' ? <NotesTab lecture={lecture} notes={notes} showHint={isOwner && !lecture.verified} /> : null}
          {tab === 'plan' ? <PlanTab lecture={lecture} showHint={staff} /> : null}
          {tab === 'transcript' ? <TranscriptTab lecture={lecture} showHint={isOwner} /> : null}

          {staff ? (
            <Button
              kind="secondary"
              icon={icons.bell}
              label="Add a reminder"
              onPress={() =>
                router.push({ pathname: '/reminder-new', params: { title: `Review: ${lecture.title ?? 'lecture notes'}` } })
              }
            />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function NotesTab({ lecture, notes, showHint }: { lecture: Lecture; notes: Notes; showHint: boolean }) {
  const todos = notes.todos ?? [];
  // Feeds the read aloud button
  const readText = [notes.summary, todos.length ? 'To do.' : '', ...todos, 'Key points.', ...notes.keyPoints]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {showHint ? <AiHint text="Made by AI from the transcript. Check it before verifying." /> : null}
      <ReadAloudButton text={readText} />

      <Section title="Summary">
        <Card>
          <T>{notes.summary}</T>
        </Card>
      </Section>

      {todos.length > 0 ? (
        <Section title="To do">
          <Card>
            {todos.map((todo, i) => (
              <View key={i} style={styles.point}>
                <Icon name={icons.clock} size={22} color="primary" />
                <T style={{ flex: 1 }}>{todo}</T>
              </View>
            ))}
          </Card>
        </Section>
      ) : null}

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

      {notes.terms.length > 0 ? (
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
      ) : null}

      {lecture.flashcards.length > 0 ? (
        <Section title={`Flashcards (${lecture.flashcards.length})`}>
          {lecture.flashcards.map((card) => (
            <Card key={card.id}>
              <T variant="bodyBold">{card.front}</T>
              <T color="textSecondary">{card.back}</T>
            </Card>
          ))}
        </Section>
      ) : null}
    </>
  );
}

// The study plan is shown as a list. Ticking steps off needs somewhere to save
// which steps are done, which the database does not have yet.
function PlanTab({ lecture, showHint }: { lecture: Lecture; showHint: boolean }) {
  const plan = (lecture.study_plan as StudyPlan | null) ?? [];
  return (
    <>
      {showHint ? <AiHint text="Suggested plan for working with your student outside class." /> : null}
      {plan.length === 0 ? <EmptyState icon={icons.book} title="No study plan" message="This lecture has no study plan yet." /> : null}
      {plan.map((section, i) => (
        <Section key={i} title={section.title}>
          <Card>
            {section.tasks.map((task, j) => (
              <View key={j} style={styles.point}>
                <NumberDot n={j + 1} />
                <T style={{ flex: 1 }}>{task}</T>
              </View>
            ))}
          </Card>
        </Section>
      ))}
    </>
  );
}

function TranscriptTab({ lecture, showHint }: { lecture: Lecture; showHint: boolean }) {
  const lines = (lecture.transcript as TranscriptLine[] | null) ?? [];
  return (
    <>
      {showHint ? <AiHint text="Check names and new words. Use Edit at the bottom to fix lines." /> : null}
      <Card>
        {lines.length === 0 ? <T color="textSecondary">No transcript.</T> : null}
        {lines.map((line, i) => (
          <View key={i} style={{ gap: Spacing.half, paddingVertical: Spacing.one }}>
            {/* Deepgram numbers speakers from 0 */}
            <T variant="caption" color="textSecondary">
              {formatDuration(line.start * 1000)} · Speaker {line.speaker + 1}
            </T>
            <T>{line.text}</T>
          </View>
        ))}
      </Card>
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
  point: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start', paddingVertical: Spacing.one },
  dot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
