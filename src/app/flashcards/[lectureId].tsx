import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EmptyState, Icon, icons, ReadAloudButton, Screen, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { flashcards } from '@/lib/mock-data';

// Story 7: flip a card, then "Again" (see it later this round) or "Got it".
// Spacing cards out over days (due_at / interval_days) comes with api.ts.
export default function FlashcardsScreen() {
  const theme = useTheme();
  const { lectureId } = useLocalSearchParams<{ lectureId: string }>();
  const [queue, setQueue] = useState(() => flashcards.filter((f) => f.lectureId === lectureId));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gotIt, setGotIt] = useState(0);
  const total = flashcards.filter((f) => f.lectureId === lectureId).length;

  if (total === 0) {
    return (
      <Screen>
        <EmptyState icon={icons.cards} title="No flashcards" message="This lecture has no cards yet." />
      </Screen>
    );
  }

  if (index >= queue.length) {
    return (
      <Screen>
        <View style={styles.done}>
          <Icon name={icons.star} size={64} color="accent" />
          <T variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
            Great job!
          </T>
          <T style={{ textAlign: 'center' }}>You practiced all {total} cards.</T>
        </View>
        <Button big label="Done" onPress={() => router.back()} />
      </Screen>
    );
  }

  const card = queue[index];
  const next = (again: boolean) => {
    if (again) setQueue((q) => [...q, card]);
    else setGotIt((n) => n + 1);
    setIndex((i) => i + 1);
    setFlipped(false);
  };

  return (
    <Screen
      footer={
        flipped ? (
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Button kind="secondary" label="Again" onPress={() => next(true)} style={{ flex: 1 }} />
            <Button label="Got it" icon={{ ios: 'checkmark', android: 'check', web: 'check' }} onPress={() => next(false)} style={{ flex: 1 }} />
          </View>
        ) : (
          <Button label="Show answer" onPress={() => setFlipped(true)} />
        )
      }>
      <View style={{ gap: Spacing.two }}>
        <T color="textSecondary" accessibilityLiveRegion="polite">
          {gotIt} of {total} learned
        </T>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.fill, { backgroundColor: theme.primary, width: `${(gotIt / total) * 100}%` }]} />
        </View>
      </View>

      <Pressable
        onPress={() => setFlipped((f) => !f)}
        accessibilityRole="button"
        accessibilityLabel={flipped ? `Answer: ${card.back}. Tap to see the question.` : `Question: ${card.front}. Tap to see the answer.`}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: flipped ? theme.primarySoft : theme.backgroundElement, borderColor: flipped ? theme.primary : theme.border },
          pressed && { opacity: 0.85 },
        ]}>
        <T variant="caption" color={flipped ? 'primary' : 'textSecondary'} style={{ fontWeight: '700' }}>
          {flipped ? 'ANSWER' : 'QUESTION'}
        </T>
        <T variant="title" style={{ textAlign: 'center' }}>
          {flipped ? card.back : card.front}
        </T>
        <T variant="caption" color="textSecondary">
          Tap to flip
        </T>
      </Pressable>

      <ReadAloudButton text={flipped ? card.back : card.front} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  card: {
    minHeight: 320,
    borderRadius: 28,
    borderWidth: 2,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  done: { alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.six },
});
