import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Badge, Button, Card, Chip, Icon, icons, Screen, Section, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { courses, formatClock, type TranscriptLine } from '@/lib/mock-data';

type Phase = 'idle' | 'recording' | 'paused';

// GUI for story 2 (record) with a simulated real-time transcript.
// Real audio capture (expo-audio) and live transcription replace the timer script later.
//
// Best practices:
// - Model the screen as one `phase` value instead of several booleans
//   (isRecording, isPaused). Impossible combinations then cannot happen.
// - Staff only. The tab is hidden for students in app-tabs.tsx. When real recording
//   lands, also check the role before uploading, since hiding a tab is not security.
// - Before shipping real recording: ask for microphone permission first, keep the
//   screen awake while recording, and save audio in chunks so a crash mid-lecture
//   does not lose everything.
export default function RecordScreen() {
  const theme = useTheme();
  const [courseId, setCourseId] = useState(courses[0].id);
  const [phase, setPhase] = useState<Phase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [marked, setMarked] = useState<Set<number>>(new Set());
  // A ref holds the running count without causing a re-render on each change.
  // The interval callback reads it, so it never sees a stale value.
  const elapsed = useRef(0);

  // Run the timer only while recording. Returning clearInterval as the cleanup
  // stops it on pause, stop, or when the user leaves the screen. Without cleanup
  // the interval keeps running and leaks.
  useEffect(() => {
    if (phase !== 'recording') return;
    const id = setInterval(() => {
      elapsed.current += 1;
      const t = elapsed.current;
      setSeconds(t);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const reset = () => {
    elapsed.current = 0;
    setSeconds(0);
    setLines([]);
    setMarked(new Set());
    setPhase('idle');
  };

  // Confirm before ending a recording. An accidental tap on Stop should not end
  // a lecture, and the cancel option is listed first so it is the safe default.
  const stop = () =>
    Alert.alert('Stop recording?', 'The lecture will be saved and notes will be made.', [
      { text: 'Keep recording', style: 'cancel' },
      {
        text: 'Stop and save',
        onPress: () => {
          reset();
          Alert.alert('Saved', 'Notes will be ready in a few minutes. We will show it under "Needs your review".');
          router.navigate('/');
        },
      },
    ]);

  const markImportant = () => {
    if (lines.length === 0) return;
    setMarked((m) => new Set(m).add(lines.length - 1));
  };

  // The `!` is safe only because courseId always comes from `courses`. Once courses
  // load from the database, handle the not-found case instead.
  const course = courses.find((c) => c.id === courseId)!;
  const live = phase === 'recording';

  return (
    <Screen tab title="Record" subtitle={phase === 'idle' ? 'Pick the class, then press Start.' : course.name}>
      {phase === 'idle' ? (
        <Section title="Class">
          <View style={styles.chips}>
            {courses.map((c) => (
              <Chip key={c.id} label={c.code} selected={c.id === courseId} onPress={() => setCourseId(c.id)} />
            ))}
          </View>
        </Section>
      ) : null}

      <Card style={{ alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.four }}>
        {/* accessibilityLiveRegion makes Android screen readers announce status
            changes. Color is never the only signal: the dot always has a text label. */}
        <View style={styles.statusRow} accessibilityLiveRegion="polite">
          <View style={[styles.dot, { backgroundColor: live ? theme.danger : theme.textSecondary }]} />
          <T variant="bodyBold" color={live ? 'danger' : 'textSecondary'}>
            {phase === 'idle' ? 'Ready' : live ? 'Recording' : 'Paused'}
          </T>
        </View>
        <T variant="display" accessibilityLabel={`Time ${formatClock(seconds)}`}>
          {formatClock(seconds)}
        </T>

        {phase === 'idle' ? (
          <Button big icon={icons.mic} label="Start" onPress={() => setPhase('recording')} style={{ alignSelf: 'stretch' }} />
        ) : (
          <View style={styles.controls}>
            <Button
              kind="secondary"
              icon={live ? icons.pause : icons.mic}
              label={live ? 'Pause' : 'Resume'}
              onPress={() => setPhase(live ? 'paused' : 'recording')}
              style={{ flex: 1 }}
            />
            <Button kind="danger" icon={icons.stop} label="Stop" onPress={stop} style={{ flex: 1 }} />
          </View>
        )}
        {phase !== 'idle' ? (
          <Button
            kind="accent"
            icon={icons.star}
            label="Mark important"
            onPress={markImportant}
            disabled={lines.length === 0}
            style={{ alignSelf: 'stretch' }}
          />
        ) : null}
      </Card>

      <Section title="Live transcript" action={lines.length ? <Badge label={`${lines.length} lines`} /> : null}>
        <Card>
          {lines.length === 0 ? (
            <T color="textSecondary">The transcript shows up here while the teacher talks.</T>
          ) : (
            // Newest line first, so it stays in view. Copy before reverse() because
            // reverse() mutates the array, and state must never be mutated.
            // A long real transcript should move to a FlatList so offscreen
            // lines are not all rendered at once.
            [...lines].reverse().map((line, i) => {
              const index = lines.length - 1 - i;
              const star = marked.has(index);
              return (
                <View
                  key={index}
                  style={[styles.line, star && { backgroundColor: theme.accentSoft }, i > 0 && { opacity: 0.85 }]}>
                  <View style={styles.lineMeta}>
                    <T variant="caption" color="textSecondary">
                      {formatClock(line.start)} · {line.speaker}
                    </T>
                    {star ? <Icon name={icons.star} size={14} color="warning" /> : null}
                  </View>
                  <T>{line.text}</T>
                </View>
              );
            })
          )}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dot: { width: 12, height: 12, borderRadius: 6 },
  controls: { flexDirection: 'row', gap: Spacing.two, alignSelf: 'stretch' },
  line: { gap: Spacing.half, padding: Spacing.two, borderRadius: 12 },
  lineMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
