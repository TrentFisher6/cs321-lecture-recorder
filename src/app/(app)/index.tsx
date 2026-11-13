// Home tab ("/"). Staff and students get different home screens.
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, EmptyState, Icon, icons, Input, Screen, Section, T } from '@/components/kit';
import { LectureRow } from '@/components/lecture-row';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import {
  createCourse,
  listCourses,
  listDueFlashcards,
  listLectures,
  listReminders,
  type Course,
  type Lecture,
  type Reminder,
} from '@/lib/api';
import { formatDayTime } from '@/lib/time';

// Best practices:
// - Split per-role views into separate components instead of one component full of
//   `if (staff)` checks. Each view then calls only the hooks it needs, and hooks
//   are never called conditionally (React's rules of hooks).
// - Data comes from src/lib/api.ts. Never call Supabase directly from a screen.
// - Reload on focus (useFocusEffect), so coming back from a lecture shows its new state.
//   From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
export default function HomeScreen() {
  const { role } = useSession();
  return role === 'staff' ? <StaffHome /> : <StudentHome />;
}

// Course id -> name, for showing which course a lecture belongs to
function courseNames(courses: Course[]) {
  return Object.fromEntries(courses.map((c) => [c.id, c.name]));
}

function StaffHome() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const [c, l] = await Promise.all([listCourses(), listLectures()]);
      setCourses(c);
      setLectures(l);
      setLoaded(true);
    } catch (e) {
      setStatus('Could not load: ' + (e as Error).message);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function addCourse() {
    const name = courseName.trim();
    if (!name) return;
    try {
      await createCourse(name);
      setCourseName('');
      setStatus('');
      await load();
    } catch (e) {
      setStatus('Could not create the course: ' + (e as Error).message);
    }
  }

  // Derive lists from the loaded data on each render instead of storing them in
  // state. Copies in state can drift out of sync when a lecture gets verified.
  // Anything not ready-and-verified needs staff: review it, wait for notes, or fix a problem.
  const toReview = lectures.filter((l) => !(l.status === 'ready' && l.verified));
  const names = courseNames(courses);

  return (
    <Screen tab title="Home" subtitle="Here is what needs you today.">
      {/* Use router.navigate to switch tabs. It reuses the existing tab instead of
          stacking a second copy, which router.push would do. */}
      <Button big icon={icons.mic} label="Start recording" onPress={() => router.navigate('/record')} />

      {!!status && <T color="danger">{status}</T>}

      <Section title="Needs your review">
        {loaded && toReview.length === 0 ? (
          <EmptyState icon={icons.check} title="All caught up" message="Every lecture has been checked." />
        ) : null}
        {toReview.map((l) => (
          <LectureRow key={l.id} lecture={l} courseName={names[l.course_id]} showStatus />
        ))}
      </Section>

      <Section title="Courses">
        {loaded && courses.length === 0 ? (
          <EmptyState icon={icons.book} title="No courses yet" message="Make your first course below." />
        ) : null}
        {courses.map((c) => {
          const count = lectures.filter((l) => l.course_id === c.id).length;
          const lectureText = `${count} ${count === 1 ? 'lecture' : 'lectures'}`;
          return (
            // Use the { pathname, params } form for dynamic routes. With typed routes on,
            // TypeScript checks the path exists and the params match.
            // Give every pressable card an accessibilityLabel so screen readers say
            // one clear sentence instead of reading each text piece separately.
            <Card
              key={c.id}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id, name: c.name } })}
              accessibilityLabel={`${c.name}, ${lectureText}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <Icon name={icons.book} size={28} color="primary" />
                <View style={{ flex: 1 }}>
                  <T variant="bodyBold">{c.name}</T>
                  <T variant="caption" color="textSecondary">
                    {lectureText}
                  </T>
                </View>
                <Icon name={icons.chevron} size={18} color="textSecondary" />
              </View>
            </Card>
          );
        })}

        <Card>
          <Input
            label="New course"
            placeholder="Course name"
            value={courseName}
            onChangeText={setCourseName}
            onSubmitEditing={addCourse}
            returnKeyType="done"
          />
          <Button kind="secondary" icon={icons.plus} label="Create course" onPress={addCourse} disabled={!courseName.trim()} />
        </Card>
      </Section>
    </Screen>
  );
}

// Student home keeps choices few and large: next reminder, practice, notes.
// Students only get verified lectures. The database rules enforce that, not this screen.
function StudentHome() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [cardCount, setCardCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('');

  useFocusEffect(
    useCallback(() => {
      Promise.all([listCourses(), listLectures(), listReminders(), listDueFlashcards()])
        .then(([c, l, r, cards]) => {
          setCourses(c);
          setLectures(l);
          setReminders(r);
          setCardCount(cards.length);
          setLoaded(true);
        })
        .catch((e) => setStatus('Could not load: ' + (e as Error).message));
    }, []),
  );

  // listReminders only returns upcoming reminders, soonest first
  const next = reminders[0];
  const names = courseNames(courses);

  return (
    <Screen tab title="Home" subtitle="Let's keep learning.">
      {!!status && <T color="danger">{status}</T>}

      {next ? (
        <Card
          tone="accentSoft"
          onPress={() => router.navigate('/reminders')}
          accessibilityLabel={`Next reminder: ${next.title}, ${formatDayTime(next.remind_at)}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Icon name={icons.bell} size={32} color="warning" />
            <View style={{ flex: 1 }}>
              <T variant="caption" color="textSecondary">
                Next reminder
              </T>
              <T variant="heading">{next.title}</T>
              <T color="textSecondary">{formatDayTime(next.remind_at)}</T>
            </View>
          </View>
        </Card>
      ) : null}

      <Card
        tone="primarySoft"
        onPress={() => router.navigate('/flashcards')}
        accessibilityLabel={`Practice flashcards, ${cardCount} ready`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <Icon name={icons.cards} size={32} color="primary" />
          <View style={{ flex: 1 }}>
            <T variant="heading">Practice flashcards</T>
            <T color="textSecondary">
              {cardCount} {cardCount === 1 ? 'card' : 'cards'} ready
            </T>
          </View>
          <Icon name={icons.chevron} size={18} color="textSecondary" />
        </View>
      </Card>

      <Section title="Your notes">
        {loaded && lectures.length === 0 ? (
          <EmptyState icon={icons.book} title="No notes yet" message="Notes show up here after your support staff checks them." />
        ) : null}
        {/* listLectures returns the newest first */}
        {lectures.map((l) => (
          <LectureRow key={l.id} lecture={l} courseName={names[l.course_id]} />
        ))}
      </Section>
    </Screen>
  );
}
