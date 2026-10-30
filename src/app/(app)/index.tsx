import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, EmptyState, Icon, icons, Screen, Section, T } from '@/components/kit';
import { LectureRow } from '@/components/lecture-row';
import { Spacing } from '@/constants/theme';
import { useDemo, useVisibleLectures, useVisibleReminders } from '@/demo-store';
import { courses, flashcards, formatDayTime, people } from '@/lib/mock-data';

export default function HomeScreen() {
  const { role } = useDemo();
  return role === 'staff' ? <StaffHome /> : <StudentHome />;
}

function StaffHome() {
  const lectures = useVisibleLectures();
  const needsReview = lectures.filter((l) => l.status === 'ready' && !l.verified);
  const processing = lectures.filter((l) => l.status === 'processing');

  return (
    <Screen tab title={`Hi, ${people.staff.name.split(' ')[0]}`} subtitle="Here is what needs you today.">
      <Button big icon={icons.mic} label="Start recording" onPress={() => router.navigate('/record')} />

      <Section title="Needs your review">
        {needsReview.length === 0 && processing.length === 0 ? (
          <EmptyState icon={icons.check} title="All caught up" message="Every lecture has been checked." />
        ) : null}
        {needsReview.map((l) => (
          <LectureRow key={l.id} lecture={l} showCourse />
        ))}
        {processing.map((l) => (
          <LectureRow key={l.id} lecture={l} showCourse />
        ))}
      </Section>

      <Section title="Courses">
        {courses.map((c) => {
          const count = lectures.filter((l) => l.courseId === c.id).length;
          return (
            <Card
              key={c.id}
              onPress={() => router.push({ pathname: '/course/[id]', params: { id: c.id } })}
              accessibilityLabel={`${c.name}, ${count} lectures`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
                <Icon name={icons.book} size={28} color="primary" />
                <View style={{ flex: 1 }}>
                  <T variant="bodyBold">{c.name}</T>
                  <T variant="caption" color="textSecondary">
                    {c.code} · {count} {count === 1 ? 'lecture' : 'lectures'}
                  </T>
                </View>
                <Icon name={icons.chevron} size={18} color="textSecondary" />
              </View>
            </Card>
          );
        })}
      </Section>
    </Screen>
  );
}

function StudentHome() {
  const lectures = useVisibleLectures();
  const reminders = useVisibleReminders();
  const next = reminders.find((r) => new Date(r.remindAt) > new Date());
  const cardCount = flashcards.filter((f) => lectures.some((l) => l.id === f.lectureId)).length;
  const recent = [...lectures].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen tab title={`Hi, ${people.student.name.split(' ')[0]}!`} subtitle="Let's keep learning.">
      {next ? (
        <Card tone="accentSoft" onPress={() => router.navigate('/reminders')} accessibilityLabel={`Next reminder: ${next.title}`}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Icon name={icons.bell} size={32} color="warning" />
            <View style={{ flex: 1 }}>
              <T variant="caption" color="textSecondary">
                Next reminder
              </T>
              <T variant="heading">{next.title}</T>
              <T color="textSecondary">{formatDayTime(next.remindAt)}</T>
            </View>
          </View>
        </Card>
      ) : null}

      <Card tone="primarySoft" onPress={() => router.navigate('/study')} accessibilityLabel={`Practice ${cardCount} flashcards`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <Icon name={icons.cards} size={32} color="primary" />
          <View style={{ flex: 1 }}>
            <T variant="heading">Practice flashcards</T>
            <T color="textSecondary">{cardCount} cards ready</T>
          </View>
          <Icon name={icons.chevron} size={18} color="textSecondary" />
        </View>
      </Card>

      <Section title="Your notes">
        {recent.length === 0 ? (
          <EmptyState icon={icons.book} title="No notes yet" message={`Notes show up here after ${people.staff.name.split(' ')[0]} checks them.`} />
        ) : (
          recent.map((l) => <LectureRow key={l.id} lecture={l} showCourse />)
        )}
      </Section>
    </Screen>
  );
}
