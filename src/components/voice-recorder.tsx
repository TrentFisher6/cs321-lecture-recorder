import {
    AudioModule,
    RecordingPresets,
    setAudioModeAsync,
    useAudioRecorder,
    useAudioRecorderState,
} from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

type Status = 'idle' | 'recording' | 'paused';

type Props = {
  /** Called after the file has been saved to device storage. */
  onSaved?: (recording: { uri: string; durationMs: number }) => void;
};

const formatTime = (ms: number) => {
  const total = Math.floor(ms / 1000);
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
};

export default function voice-recorder({ onSaved }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY); // AAC in .m4a
  const recorderState = useAudioRecorderState(recorder);
  const [status, setStatus] = useState<Status>('idle');
  const [savedUri, setSavedUri] = useState<string | null>(null);

  const start = async () => {
    try {
      const { granted, canAskAgain } =
        await AudioModule.requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone access needed',
          'Please allow microphone access to record audio.',
          canAskAgain
            ? [{ text: 'OK' }]
            : [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open settings', onPress: () => Linking.openSettings() },
              ]
        );
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSavedUri(null);
      setStatus('recording');
    } catch (e) {
      Alert.alert('Could not start recording', String(e));
    }
  };

  const pause = () => {
    recorder.pause();
    setStatus('paused');
  };

  const resume = () => {
    recorder.record();
    setStatus('recording');
  };

  const stop = async () => {
    try {
      const durationMs = recorderState.durationMillis;
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      setStatus('idle');

      const tempUri = recorder.uri;
      if (!tempUri) throw new Error('No recording was produced.');

      // The recorder writes to the cache directory, which the OS can clear.
      // Move the file into persistent app storage.
      const dir = new Directory(Paths.document, 'recordings');
      dir.create({ intermediates: true, idempotent: true });
      const dest = new File(dir, `recording-${Date.now()}.m4a`);
      new File(tempUri).move(dest);

      setSavedUri(dest.uri);
      onSaved?.({ uri: dest.uri, durationMs });
    } catch (e) {
      setStatus('idle');
      Alert.alert('Could not save recording', String(e));
    }
  };

  const isIdle = status === 'idle';

  return (
    <View style={styles.container}>
      <Text style={styles.timer}>{formatTime(recorderState.durationMillis)}</Text>
      <Text style={styles.status}>
        {status === 'recording' ? '● Recording' : status === 'paused' ? 'Paused' : 'Ready'}
      </Text>

      <View style={styles.row}>
        {isIdle && (
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

        <Pressable
          style={[styles.button, styles.stop, isIdle && styles.disabled]}
          onPress={stop}
          disabled={isIdle}
        >
          <Text style={styles.label}>Stop</Text>
        </Pressable>
      </View>

      {savedUri && (
        <Text style={styles.saved} numberOfLines={2}>
          Saved: {savedUri}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 24 },
  timer: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '600' },
  status: { fontSize: 16, color: '#666', marginBottom: 24 },
  row: { flexDirection: 'row', gap: 12 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    minWidth: 110,
    alignItems: 'center',
  },
  record: { backgroundColor: '#d92d20' },
  pause: { backgroundColor: '#f79009' },
  stop: { backgroundColor: '#344054' },
  disabled: { opacity: 0.4 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saved: { marginTop: 24, fontSize: 12, color: '#666', textAlign: 'center' },
});
