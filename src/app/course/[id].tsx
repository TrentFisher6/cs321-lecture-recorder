// Course screen. Lists the course's lectures. Staff can record a new lecture and invite students here
import { Asset } from 'expo-asset';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { Button, Card, EmptyState, icons, Input, Screen, Section, T } from '@/components/kit';
import { LectureRow } from '@/components/lecture-row';
import VoiceRecorder from '@/components/voice-recorder';
import { useSession } from '@/ctx';
import { inviteStudent, listLectures, processLecture, uploadLecture, type Lecture } from '@/lib/api';

// Sample lecture for testing without recording
const TEST_AUDIO = require('@/assets/audio/test-lecture.m4a');

export default function CourseScreen() {
  // Route params from https://docs.expo.dev/router/reference/url-parameters/ -Trent
  const { id } = useLocalSearchParams<{ id: string }>();
  const { role } = useSession();
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const [email, setEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  // Load this course's lectures when the screen opens, and again when coming back from
  // a lecture (needed because the status might have changed or it may have been edited).
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  useFocusEffect(
    useCallback(() => {
      listLectures(id)
        .then((l) => {
          setLectures(l);
          setLoaded(true);
        })
        .catch((e) => setStatus('Could not load lectures: ' + (e as Error).message));
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

  async function invite() {
    const address = email.trim();
    if (!address) return;
    try {
      await inviteStudent(id, address);
      setEmail('');
      setInviteStatus(`Invited ${address}`);
    } catch (e) {
      setInviteStatus('Could not invite: ' + (e as Error).message);
    }
  }

  const isStaff = role === 'staff';

  return (
    <Screen>
      {isStaff && (
        <Section title="New lecture">
          <Card>
            <Input label="Title (optional)" placeholder="Memory and learning" value={title} onChangeText={setTitle} />
            {recording ? (
              <VoiceRecorder
                onSaved={(uri) => {
                  setRecording(false);
                  addLecture(uri);
                }}
              />
            ) : (
              <>
                <Button icon={icons.mic} label="Record lecture" onPress={() => setRecording(true)} />
                {/* In the dev build only, show a button to upload a test lecture */}
                {__DEV__ && <Button kind="secondary" label="Upload test audio" onPress={uploadTestAudio} />}
              </>
            )}
            {/* accessibilityLiveRegion makes Android screen readers announce upload progress */}
            {!!status && (
              <T color="textSecondary" accessibilityLiveRegion="polite">
                {status}
              </T>
            )}
          </Card>
        </Section>
      )}

      <Section title="Lectures">
        {loaded && lectures.length === 0 ? (
          <EmptyState
            icon={icons.mic}
            title="No lectures yet"
            message={isStaff ? 'Record one above.' : 'Check back after class.'}
          />
        ) : null}
        {lectures.map((l) => (
          <LectureRow key={l.id} lecture={l} showStatus={isStaff} />
        ))}
        {!isStaff && !!status && <T color="danger">{status}</T>}
      </Section>

      {isStaff && (
        <Section title="Students">
          <Card>
            {/* The student does not need an account yet. They see the course once they sign up with this email */}
            <Input
              label="Invite a student"
              placeholder="student@gmu.edu"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={invite}
            />
            <Button kind="secondary" label="Send invite" onPress={invite} disabled={!email.trim()} />
            {!!inviteStatus && <T color="textSecondary">{inviteStatus}</T>}
          </Card>
        </Section>
      )}
    </Screen>
  );
}
