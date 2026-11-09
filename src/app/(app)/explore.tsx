import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CoursesDemo from '@/components/courses-demo';
import FlashcardReview from '@/components/flashcard-review';
import LectureEditor from '@/components/lecture-editor';
import { useSession } from '@/ctx';
import { createLecture, listLectures, processLecture, type Lecture, type Notes, type StudyPlan, type TranscriptLine } from '@/lib/api';

// Demo of the recording pipeline. Uses a hardcoded audio file in this repo
const TEST_AUDIO = require('@/assets/audio/test-lecture.m4a');

export default function LecturesDemo() {
  const { signOut } = useSession();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  async function loadLectures() {
    try {
      setLectures(await listLectures());
    } catch (e) {
      setStatus('Failed to load lectures: ' + e);
    }
  }

  // Load the list once when the screen opens
  useEffect(() => {
    listLectures().then(setLectures);
  }, []);

  // Upload an audio file to a course, then transcribe it and write notes
  // Reading the file with fetch is from Supabase's Expo example:
  // https://github.com/supabase/supabase/blob/master/examples/user-management/expo-user-management/components/Avatar.tsx -Trent
  async function uploadAndProcess(courseId: string, audioUri: string) {
    try {
      setStatus('Uploading...');
      const audio = await fetch(audioUri).then((res) => res.arrayBuffer());

      const id = await createLecture(courseId, 'Lecture', audio);
      await loadLectures();

      setStatus('Transcribing and writing notes (about a minute)...');
      await processLecture(id);
      setStatus('Done');
      setOpenId(id);
    } catch (e) {
      setStatus('Failed: ' + e);
    }
    loadLectures();
  }

  // Upload the bundled test audio instead of recording
  async function uploadTestLecture(courseId: string) {
    const asset = Asset.fromModule(TEST_AUDIO);
    await asset.downloadAsync();
    uploadAndProcess(courseId, asset.localUri!);
  }

  // Tap a lecture to open it, tap again to close it
  function toggleOpen(id: string) {
    if (openId === id) {
      setOpenId(null);
    } else {
      setOpenId(id);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Button title="Log out" onPress={signOut} />
      <CoursesDemo onUploadTest={uploadTestLecture} onRecorded={uploadAndProcess} />
      <FlashcardReview />
      <Text>{status}</Text>
      <FlatList
        data={lectures}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleOpen(item.id)} style={styles.row}>
            <Text style={styles.bold}>
              {item.title} · {item.status} · {item.verified ? 'verified' : 'not verified'}
            </Text>
            {openId === item.id && <LectureDetail lecture={item} onChanged={loadLectures} />}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

// The staff member who owns the lecture can edit it, everyone else just reads it
function LectureDetail({ lecture, onChanged }: { lecture: Lecture; onChanged: () => void }) {
  const { session } = useSession();
  const isOwner = session?.user.id === lecture.owner_id;
  const notes = lecture.notes as Notes | null;
  const transcript = (lecture.transcript as TranscriptLine[] | null) ?? [];
  const studyPlan = (lecture.study_plan as StudyPlan | null) ?? [];
  if (!notes) return <Text>No notes yet.</Text>;
  return (
    <View style={{ gap: 6 }}>
      {isOwner ? <LectureEditor lecture={lecture} onSaved={onChanged} /> : <Text>{notes.summary}</Text>}
      <Text style={styles.bold}>To do</Text>
      {(notes.todos ?? []).map((todo) => (
        <Text key={todo}>- {todo}</Text>
      ))}
      <Text style={styles.bold}>Key points</Text>
      {notes.keyPoints.map((p) => (
        <Text key={p}>• {p}</Text>
      ))}
      {notes.terms.map((t) => (
        <Text key={t.term}>
          <Text style={styles.bold}>{t.term}</Text>: {t.meaning}
        </Text>
      ))}
      <Text style={styles.bold}>Flashcards</Text>
      {lecture.flashcards.map((card) => (
        <Text key={card.id}>
          {card.front} → {card.back}
        </Text>
      ))}
      <Text style={styles.bold}>Study plan</Text>
      {studyPlan.map((section) => (
        <View key={section.title}>
          <Text>{section.title}</Text>
          {section.tasks.map((task) => (
            <Text key={task}>- {task}</Text>
          ))}
        </View>
      ))}
      {!isOwner && <Text style={styles.bold}>Transcript (first 10 lines)</Text>}
      {!isOwner &&
        transcript.slice(0, 10).map((t) => (
          <Text key={t.start}>
            {t.text}
          </Text>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, gap: 8 },
  row: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 6 },
  bold: { fontWeight: '600' },
});
