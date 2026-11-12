// Course screen. Lists the course's lectures. Staff can record a new lecture here
import { Asset } from 'expo-asset';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import VoiceRecorder from '@/components/voice-recorder';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listLectures, myRole, processLecture, uploadLecture, type Lecture } from '@/lib/api';

// Sample lecture for testing without recording
const TEST_AUDIO = __DEV__ ? require('@/assets/audio/test-lecture.m4a') : null;

// What each lecture status means to the user
const STATUS_TEXT: Record<string, string> = {
  uploaded: 'Uploaded',
  processing: 'Processing...',
  ready: 'Ready',
  error: 'Something went wrong',
};

export default function CourseScreen() {
  // Route params from https://docs.expo.dev/router/reference/url-parameters/ -Trent
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const [role, setRole] = useState<string | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [title, setTitle] = useState('');
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');

  // Load the role and this course's lectures when the screen opens, and again when coming closing
  // a lecture (needed because thr status might have changed or it may have been edited).
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  useFocusEffect(
    useCallback(() => {
      myRole().then(setRole);
      listLectures(id).then(setLectures);
    }, [id]),
  );

  // Upload the audio and process it to write the notes, summary, and flashcards
  async function addLecture(audioUri: string) {
    const lectureTitle = title.trim() || `Lecture ${new Date().toLocaleDateString()}`;
    try {
      setStatus('Uploading...');
      const lectureId = await uploadLecture(id, lectureTitle, audioUri);
      setTitle('');
      setLectures(await listLectures(id));
      setStatus('Transcribing and writing notes (about a minute)...');
      await processLecture(lectureId);
      setStatus('Notes are ready');
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
    setLectures(await listLectures(id));
  }

  async function uploadTestAudio() {
    const asset = Asset.fromModule(TEST_AUDIO);
    await asset.downloadAsync();
    addLecture(asset.localUri!);
  }

  const isStaff = role === 'staff';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isStaff && (
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="smallBold">New lecture</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: theme.border, color: theme.text }]}
              placeholder="Title (optional)"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />
            {recording ? (
              <VoiceRecorder
                onSaved={(uri) => {
                  setRecording(false);
                  addLecture(uri);
                }}
              />
            ) : (
              <View style={styles.row}>
                <Button title="Record lecture" color={theme.primary} onPress={() => setRecording(true)} />
                  {/*In the dev build only, show a button to upload a test lecture */}
                {__DEV__ && <Button title="Upload test audio" color={theme.primary} onPress={uploadTestAudio} />}
              </View>
            )}
            {!!status && <ThemedText type="small">{status}</ThemedText>}
          </ThemedView>
        )}

        <ThemedText type="smallBold">Lectures</ThemedText>
        {lectures.map((lecture) => (
          <Pressable
            key={lecture.id}
            onPress={() => router.push({ pathname: '/lecture/[id]', params: { id: lecture.id, name: lecture.title ?? 'Lecture' } })}>
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">{lecture.title}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {lecture.date ? new Date(lecture.date).toLocaleDateString() : ''} · {STATUS_TEXT[lecture.status ?? ''] ?? lecture.status}
                {isStaff ? (lecture.verified ? ' · Verified' : ' · Not verified') : ''}
              </ThemedText>
            </ThemedView>
          </Pressable>
        ))}

        {role && lectures.length === 0 && (
          <ThemedText themeColor="textSecondary">
            {isStaff ? 'No lectures yet. Record one above.' : 'No lectures yet. Check back after class.'}
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', justifyContent: 'center' },
  content: { padding: Spacing.four, gap: Spacing.three, width: '100%', maxWidth: MaxContentWidth },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
});
