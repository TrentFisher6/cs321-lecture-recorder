// Lecture screen. Shows the notes, to-dos, study plan, flashcards, and transcript.
// The staff member who owns it can edit it and mark it verified.
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Button, ScrollView, StyleSheet, View } from 'react-native';

import LectureEditor from '@/components/lecture-editor';
import ReadAloud from '@/components/read-aloud';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useTheme } from '@/hooks/use-theme';
import { getLecture, updateLecture, type Lecture, type Notes, type StudyPlan, type TranscriptLine } from '@/lib/api';

export default function LectureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const theme = useTheme();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('');

  async function load() {
    setLecture(await getLecture(id));
  }

  // Load the lecture when the screen opens
  useEffect(() => {
    getLecture(id).then(setLecture);
  }, [id]);

  async function toggleVerified() {
    if (!lecture) return;
    try {
      await updateLecture(lecture.id, { verified: !lecture.verified });
      await load();
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
  }

  if (!lecture) return <ThemedView style={styles.container} />;

  const isOwner = session?.user.id === lecture.owner_id;
  const notes = lecture.notes as Notes | null;
  const studyPlan = (lecture.study_plan as StudyPlan | null) ?? [];
  const transcript = (lecture.transcript as TranscriptLine[] | null) ?? [];
  const todos = notes?.todos ?? [];

  // Feeds the TTS engine on the read aloud button
  const spokenNotes = notes
    ? [notes.summary, 'To do.', ...todos, 'Key points.', ...notes.keyPoints].join(' ')
    : '';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isOwner && (
          <ThemedView type={lecture.verified ? 'successSoft' : 'warningSoft'} style={styles.card}>
            <ThemedText type="smallBold">
              {lecture.verified ? 'Verified: students can see this lecture' : 'Not verified: students can’t see this yet'}
            </ThemedText>
            <View style={styles.row}>
              {notes && <Button title={editing ? 'Stop editing' : 'Edit'} color={theme.primary} onPress={() => setEditing(!editing)} />}
              <Button title={lecture.verified ? 'Unverify' : 'Mark verified'} color={theme.primary} onPress={toggleVerified} />
            </View>
            {!!status && <ThemedText type="small">{status}</ThemedText>}
          </ThemedView>
        )}

        {!notes && <ThemedText themeColor="textSecondary">Notes aren’t ready yet. Check back soon!</ThemedText>}

        {notes && editing && (
          <LectureEditor
            lecture={lecture}
            onSaved={() => {
              setEditing(false);
              load();
            }}
          />
        )}

        {notes && !editing && (
          <>
            <ReadAloud text={spokenNotes} />

            <Section title="Summary">
              <ThemedText>{notes.summary}</ThemedText>
            </Section>

            {todos.length > 0 && (
              <Section title="To do">
                {todos.map((todo) => (
                  <ThemedText key={todo}>- {todo}</ThemedText>
                ))}
              </Section>
            )}

            <Section title="Key points">
              {notes.keyPoints.map((point) => (
                <ThemedText key={point}>• {point}</ThemedText>
              ))}
            </Section>

            <Section title="Terms">
              {notes.terms.map((t) => (
                <ThemedText key={t.term}>
                  <ThemedText type="smallBold">{t.term}</ThemedText>: {t.meaning}
                </ThemedText>
              ))}
            </Section>

            <Section title="Study plan">
              {studyPlan.map((section) => (
                <View key={section.title}>
                  <ThemedText type="smallBold">{section.title}</ThemedText>
                  {section.tasks.map((task) => (
                    <ThemedText key={task}>• {task}</ThemedText>
                  ))}
                </View>
              ))}
            </Section>

            <Collapsible title={`Flashcards (${lecture.flashcards.length})`}>
              {lecture.flashcards.map((card) => (
                <ThemedText key={card.id}>
                  <ThemedText type="smallBold">{card.front}</ThemedText> {card.back}
                </ThemedText>
              ))}
            </Collapsible>

            <Collapsible title="Full transcript">
              {transcript.map((line) => (
                <ThemedText key={line.start}>{line.text}</ThemedText>
              ))}
            </Collapsible>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

// A titled card around one part of the notes
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
});
