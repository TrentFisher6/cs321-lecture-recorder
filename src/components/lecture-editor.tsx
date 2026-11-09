// This is so that staff can edit the transcript and fix any errors,
// and adjust the study plan to fit their student
import { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { updateLecture, type Lecture, type Notes, type StudyPlan, type TranscriptLine } from '@/lib/api';

// onSaved reloads the lecture list after a change
export default function LectureEditor({ lecture, onSaved }: { lecture: Lecture; onSaved: () => void }) {
  const notes = lecture.notes as Notes;
  const [summary, setSummary] = useState(notes.summary);
  const [transcript, setTranscript] = useState((lecture.transcript as TranscriptLine[] | null) ?? []);
  const [studyPlan, setStudyPlan] = useState((lecture.study_plan as StudyPlan | null) ?? []);
  const [status, setStatus] = useState('');

  // Replace the text of one transcript line
  function editLine(index: number, text: string) {
    setTranscript(transcript.map((line, i) => (i === index ? { ...line, text } : line)));
  }

  // Replace one study plan section (its title or its list of tasks)
  function editSection(index: number, section: StudyPlan[number]) {
    setStudyPlan(studyPlan.map((old, i) => (i === index ? section : old)));
  }

  async function save() {
    try {
      await updateLecture(lecture.id, { notes: { ...notes, summary }, transcript, study_plan: studyPlan });
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
      <Text style={styles.bold}>Study plan</Text>
      {studyPlan.map((section, sectionIndex) => (
        <View key={sectionIndex} style={styles.box}>
          <TextInput
            style={[styles.input, styles.bold]}
            value={section.title}
            onChangeText={(title) => editSection(sectionIndex, { ...section, title })}
          />
          {section.tasks.map((task, taskIndex) => (
            <View key={taskIndex} style={styles.row}>
              <TextInput
                style={[styles.input, styles.grow]}
                value={task}
                onChangeText={(text) =>
                  editSection(sectionIndex, { ...section, tasks: section.tasks.map((old, i) => (i === taskIndex ? text : old)) })
                }
              />
              <Button
                title="Remove"
                onPress={() => editSection(sectionIndex, { ...section, tasks: section.tasks.filter((_, i) => i !== taskIndex) })}
              />
            </View>
          ))}
          <Button title="Add task" onPress={() => editSection(sectionIndex, { ...section, tasks: [...section.tasks, ''] })} />
        </View>
      ))}
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grow: { flex: 1 },
  input: { borderWidth: 1, borderColor: '#86939e', borderRadius: 4, padding: 8 },
  bold: { fontWeight: '600' },
});
