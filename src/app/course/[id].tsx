import { Stack, useLocalSearchParams } from 'expo-router';

import { EmptyState, icons, Screen, T } from '@/components/kit';
import { LectureRow } from '@/components/lecture-row';
import { useVisibleLectures } from '@/demo-store';
import { courses } from '@/lib/mock-data';

// Story 5: lectures in one course, newest first, with status.
export default function CourseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = courses.find((c) => c.id === id);
  const lectures = useVisibleLectures()
    .filter((l) => l.courseId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen>
      <Stack.Screen options={{ title: course?.code ?? 'Course' }} />
      <T variant="title" accessibilityRole="header">
        {course?.name ?? 'Course not found'}
      </T>
      {lectures.length === 0 ? (
        <EmptyState icon={icons.mic} title="No lectures yet" message="Record a lecture to see it here." />
      ) : (
        lectures.map((l) => <LectureRow key={l.id} lecture={l} />)
      )}
    </Screen>
  );
}
