import { Asset } from 'expo-asset';
import { useEffect, useState } from 'react';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CoursesDemo from '@/components/courses-demo';
import { useSession } from '@/ctx';
import { createLecture, listLectures, processLecture, type Lecture, type Notes, type TranscriptLine } from '@/lib/api';

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

  async function uploadAndProcess() {
    try {
      setStatus('Uploading...');
      // Get the bundled audio file and read it into memory
      const asset = Asset.fromModule(TEST_AUDIO);
      await asset.downloadAsync();
      const response = await fetch(asset.localUri!);
      const audio = await response.arrayBuffer();

      const id = await createLecture('Test lecture', audio);
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
      <CoursesDemo />
      <Button title="Upload + process test lecture" onPress={uploadAndProcess} />
      <Text>{status}</Text>
      <FlatList
        data={lectures}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleOpen(item.id)} style={styles.row}>
            <Text style={styles.bold}>
              {item.title} · {item.status}
            </Text>
            {openId === item.id && <LectureDetail lecture={item} />}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

function LectureDetail({ lecture }: { lecture: Lecture }) {
  const notes = lecture.notes as Notes | null;
  const transcript = (lecture.transcript as TranscriptLine[] | null) ?? [];
  if (!notes) return <Text>No notes yet.</Text>;
  return (
    <View style={{ gap: 6 }}>
      <Text>{notes.summary}</Text>
      {notes.keyPoints.map((p) => (
        <Text key={p}>• {p}</Text>
      ))}
      {notes.terms.map((t) => (
        <Text key={t.term}>
          <Text style={styles.bold}>{t.term}</Text>: {t.meaning}
        </Text>
      ))}
      <Text style={styles.bold}>Transcript (first 10 lines)</Text>
      {transcript.slice(0, 10).map((t) => (
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
