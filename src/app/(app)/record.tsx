import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, EmptyState, icons, Input, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listCourses, processLecture, uploadLecture, type Course } from '@/lib/api';
import { formatDuration } from '@/lib/time';

type Phase = 'idle' | 'recording' | 'paused' | 'saving';

// Record screen (staff only, the tab is hidden for students in app-tabs.tsx).
// UI by Jared, wired to the real recorder and upload by Trent.
// Recording follows https://docs.expo.dev/versions/v58.0.0/sdk/audio/ (Recording sounds) -Trent
//
// Best practices:
// - Model the screen as one `phase` value instead of several booleans
//   (isRecording, isPaused). Impossible combinations then cannot happen.
// - We don't only hide the tab here but also use RLS to ensure students cant submit recordings
export default function RecordScreen() {
  const theme = useTheme();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); // .m4a file
  const recorderState = useAudioRecorderState(recorder);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');

  // Reload courses each time the tab opens
  useFocusEffect(
    useCallback(() => {
      listCourses().then((list) => {
        setCourses(list);
        setCourseId((id) => id ?? list[0]?.id ?? null);
      });
    }, []),
  );

  async function start() {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Microphone access needed', 'Please allow microphone access in Settings.');
      return;
    }
    // Keeps recording in the background. On Android this shows a notification while recording
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, allowsBackgroundRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setPhase('recording');
  }

  function pauseOrResume() {
    if (phase === 'recording') {
      recorder.pause();
      setPhase('paused');
    } else {
      recorder.record();
      setPhase('recording');
    }
  }

  // Stops the recording, upload it, then send its to claude to make notes
  async function save() {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, allowsBackgroundRecording: false });
    if (!recorder.uri || !courseId) return;

    setPhase('saving');
    const lectureTitle = title.trim() || `Lecture ${new Date().toLocaleDateString()}`;
    try {
      const lectureId = await uploadLecture(courseId, lectureTitle, recorder.uri);
      await processLecture(lectureId);
      setTitle('');
      router.push({ pathname: '/lecture/[id]', params: { id: lectureId, name: lectureTitle } });
    } catch (e) {
      Alert.alert('Could not save the lecture', (e as Error).message);
    }
    setPhase('idle');
  }

  // Confirm before ending a recording. An accidental tap on Stop should not end
  // a lecture, and the cancel option is listed first so it is the safe default.
  const stop = () =>
    Alert.alert('Stop recording?', 'The lecture will be saved and notes will be made.', [
      { text: 'Keep recording', style: 'cancel' },
      { text: 'Stop and save', onPress: save },
    ]);

  const course = courses.find((c) => c.id === courseId);
  const live = phase === 'recording';

  if (courses.length === 0) {
    return (
      <Screen tab title="Record">
        <EmptyState icon={icons.school} title="No courses yet" message="Create a course on the Home tab first." />
      </Screen>
    );
  }

  return (
    <Screen tab title="Record" subtitle={phase === 'idle' ? 'Pick the class, then press Start.' : course?.name}>
      {phase === 'idle' ? (
        <Section title="Class">
          <View style={styles.chips}>
            {courses.map((c) => (
              <Chip key={c.id} label={c.name} selected={c.id === courseId} onPress={() => setCourseId(c.id)} />
            ))}
          </View>
          <Input label="Title (optional)" placeholder={`Lecture ${new Date().toLocaleDateString()}`} value={title} onChangeText={setTitle} />
        </Section>
      ) : null}

      <Card style={{ alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four }}>
        {phase === 'saving' ? (
          // accessibilityLiveRegion makes Android screen readers announce status changes
          <View style={styles.saving} accessibilityLiveRegion="polite">
            <ActivityIndicator color={theme.primary} />
            <T variant="bodyBold">Writing notes…</T>
            <T color="textSecondary">This takes about a minute. The lecture opens when it’s ready.</T>
          </View>
        ) : (
          <>
            {/* Color is never the only signal: the dot always has a text label */}
            <View style={styles.statusRow} accessibilityLiveRegion="polite">
              <View style={[styles.dot, { backgroundColor: live ? theme.danger : theme.textSecondary }]} />
              <T variant="bodyBold" color={live ? 'danger' : 'textSecondary'}>
                {phase === 'idle' ? 'Ready' : live ? 'Recording' : 'Paused'}
              </T>
            </View>
            <T variant="display">{formatDuration(recorderState.durationMillis)}</T>

            {phase === 'idle' ? (
              <Button big icon={icons.mic} label="Start" onPress={start} style={{ alignSelf: 'stretch' }} />
            ) : (
              <View style={styles.controls}>
                <Button
                  kind="secondary"
                  icon={live ? icons.pause : icons.mic}
                  label={live ? 'Pause' : 'Resume'}
                  onPress={pauseOrResume}
                  style={{ flex: 1 }}
                />
                <Button kind="danger" icon={icons.stop} label="Stop" onPress={stop} style={{ flex: 1 }} />
              </View>
            )}
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
  controls: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  saving: { alignItems: 'center', gap: Spacing.two },
});
