// Study tab (students). Shows the flashcards that are due from all of a student's lectures.
// The tab is hidden for staff in app-tabs.tsx.
import FlashcardReview from '@/components/flashcard-review';
import { Screen } from '@/components/kit';

export default function FlashcardsScreen() {
  return (
    <Screen tab title="Study" subtitle="Practice a little every day.">
      <FlashcardReview />
    </Screen>
  );
}
