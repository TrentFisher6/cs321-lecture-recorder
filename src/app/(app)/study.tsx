import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Card, EmptyState, icons, Screen, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useVisibleLectures } from '@/demo-store';
import { courses, flashcards } from '@/lib/mock-data';

// Student tab: flashcard decks from verified lectures (story 7 entry point).
export default function StudyScreen() {
  const decks = useVisibleLectures()
    .map((lecture) => ({ lecture, count: flashcards.filter((f) => f.lectureId === lecture.id).length }))
    .filter((d) => d.count > 0);

  return (
    <Screen tab title="Study" subtitle="Practice a little every day.">
      {decks.length === 0 ? (
        <EmptyState icon={icons.cards} title="No flashcards yet" message="Cards show up here after your notes are checked." />
      ) : (
        decks.map(({ lecture, count }) => (
          <Card key={lecture.id}>
            <View style={{ gap: Spacing.one }}>
              <T variant="caption" color="textSecondary">
                {courses.find((c) => c.id === lecture.courseId)?.code}
              </T>
              <T variant="heading">{lecture.title}</T>
              <T color="textSecondary">{count} cards</T>
            </View>
            <Button
              icon={icons.cards}
              label="Practice"
              onPress={() => router.push({ pathname: '/flashcards/[lectureId]', params: { lectureId: lecture.id } })}
            />
          </Card>
        ))
      )}
    </Screen>
  );
}
