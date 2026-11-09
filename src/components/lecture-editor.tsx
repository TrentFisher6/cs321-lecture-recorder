// This is so that staff can edit the transcript and fix any errors
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { updateLecture, type Lecture, type Notes, type TranscriptLine } from '@/lib/api';

// onSaved reloads the lecture list after a change
export default function LectureEditor({ lecture, onSaved }: { lecture: Lecture; onSaved: () => void }) {
  const notes = lecture.notes as Notes;
  const [summary, setSummary] = useState(notes.summary);
  const [transcript, setTranscript] = useState((lecture.transcript as TranscriptLine[] | null) ?? []);
  const [status, setStatus] = useState('');

  // Replace the text of one transcript line
  function editLine(index: number, text: string) {
    setTranscript(transcript.map((line, i) => (i === index ? { ...line, text } : line)));
  }

  async function save() {
    try {
      await updateLecture(lecture.id, { notes: { ...notes, summary }, transcript });
      setStatus('Saved');
      onSaved();
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  async function toggleVerified() {
    try {
      await updateLecture(lecture.id, { verified: !lecture.verified });
      onSaved();
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.bold}>Summary</Text>
      <TextInput style={styles.input} multiline value={summary} onChangeText={setSummary} />
      <Text style={styles.bold}>Transcript</Text>
      {transcript.map((line, index) => (
        <TextInput
          key={line.start}
          style={styles.input}
          multiline
          value={line.text}
          onChangeText={(text) => editLine(index, text)}
        />
      ))}
      <Button title="Save changes" onPress={save} />
      <Button title={lecture.verified ? 'Unverify' : 'Mark verified'} onPress={toggleVerified} />
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6 },
  input: { borderWidth: 1, borderColor: '#86939e', borderRadius: 4, padding: 8 },
  bold: { fontWeight: '600' },
});
