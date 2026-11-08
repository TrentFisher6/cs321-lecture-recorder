// Records a lecture with start, pause, resume, and stop, and shows a timer.
// Written by Evan (EvanVoice branch), trimmed down to hand the file straight to the upload -Trent
// Based on https://docs.expo.dev/versions/v57.0.0/sdk/audio/ (Recording sounds)
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type Status = 'idle' | 'recording' | 'paused';

// Shows milliseconds as mm:ss
function formatTime(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// onSaved gets the local file uri of the finished recording
export default function VoiceRecorder({ onSaved }: { onSaved: (uri: string) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); // .m4a file
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<Status>('idle');

  async function start() {
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Microphone access needed', 'Please allow microphone access in Settings.');
      return;
    }
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setStatus('recording');
  }

  function pause() {
    recorder.pause();
    setStatus('paused');
  }

  function resume() {
    recorder.record();
    setStatus('recording');
  }

  async function stop() {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false });
    setStatus('idle');
    // The recording will be available on recorder.uri (from the Expo docs)
    if (recorder.uri) onSaved(recorder.uri);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(recorderState.durationMillis)}</Text>
      <Text>{status === 'recording' ? '● Recording' : status === 'paused' ? 'Paused' : 'Ready'}</Text>

      <View style={styles.row}>
        {status === 'idle' && (
          <Pressable style={[styles.button, styles.record]} onPress={start}>
            <Text style={styles.label}>Record</Text>
          </Pressable>
        )}
        {status === 'recording' && (
          <Pressable style={[styles.button, styles.pause]} onPress={pause}>
            <Text style={styles.label}>Pause</Text>
          </Pressable>
        )}
        {status === 'paused' && (
          <Pressable style={[styles.button, styles.record]} onPress={resume}>
            <Text style={styles.label}>Resume</Text>
          </Pressable>
        )}
        {status !== 'idle' && (
          <Pressable style={[styles.button, styles.stop]} onPress={stop}>
            <Text style={styles.label}>Stop</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8, paddingVertical: 12 },
  timer: { fontSize: 40, fontVariant: ['tabular-nums'], fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12 },
  button: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999, alignItems: 'center' },
  record: { backgroundColor: '#d92d20' },
  pause: { backgroundColor: '#f79009' },
  stop: { backgroundColor: '#344054' },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
