// Story 7: review the flashcards that are due. Flip the card, read it out loud, and answer
// "Again" or "Got it". Each answer is saved so the card comes back on the right day
// (see lib/spaced-repetition.ts).
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EmptyState, Icon, icons, ReadAloudButton, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listDueFlashcards, reviewFlashcard, type Flashcard } from '@/lib/api';

export default function FlashcardReview() {
  const theme = useTheme();
  const [cards, setCards] = useState<Flashcard[]>([]);
  // How many were due when the screen opened, for the progress bar
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Load the due cards each time the tab is opened so that new lectures show up
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  useFocusEffect(
    useCallback(() => {
      listDueFlashcards()
        .then((due) => {
          setCards(due);
          setTotal(due.length);
          setFlipped(false);
          setLoaded(true);
        })
        .catch((e) => setStatus('Could not load flashcards: ' + (e as Error).message));
    }, []),
  );

  async function answer(gotIt: boolean) {
    setSaving(true);
    try {
      await reviewFlashcard(cards[0], gotIt);
      // Move on to the next card. "Again" cards come back sooner on a later day
      setCards((c) => c.slice(1));
      setFlipped(false);
      setStatus('');
    } catch (e) {
      setStatus('Could not save: ' + (e as Error).message);
    }
    setSaving(false);
  }

  if (!loaded) return status ? <T color="danger">{status}</T> : null;

  if (total === 0) {
    return <EmptyState icon={icons.cards} title="No cards due" message="New cards show up here after your notes are checked." />;
  }

  const card = cards[0];
  const done = total - cards.length;

  if (!card) {
    return (
      <View style={styles.done}>
        <Icon name={icons.star} size={64} color="accent" />
        <T variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
          Great job!
        </T>
        <T style={{ textAlign: 'center' }}>
          You practiced all {total} {total === 1 ? 'card' : 'cards'} for today.
        </T>
      </View>
    );
  }

  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ gap: Spacing.two }}>
        <T color="textSecondary" accessibilityLiveRegion="polite">
          {done} of {total} done
        </T>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.fill, { backgroundColor: theme.primary, width: `${(done / total) * 100}%` }]} />
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

      {flipped ? (
        <View style={{ flexDirection: 'row', gap: Spacing.two }}>
          <Button kind="secondary" label="Again" onPress={() => answer(false)} disabled={saving} style={{ flex: 1 }} />
          <Button
            label="Got it"
            icon={{ ios: 'checkmark', android: 'check', web: 'check' }}
            onPress={() => answer(true)}
            disabled={saving}
            style={{ flex: 1 }}
          />
        </View>
      ) : (
        <Button label="Show answer" onPress={() => setFlipped(true)} />
      )}

      <ReadAloudButton text={flipped ? card.back : card.front} />

      {!!status && <T color="danger">{status}</T>}
    </View>
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
