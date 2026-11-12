// Component for an individual flashcard. Flip the card, read it out loud, and answer got it or again
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Pressable, StyleSheet, View } from 'react-native';

import ReadAloud from '@/components/read-aloud';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { listDueFlashcards, reviewFlashcard, type Flashcard } from '@/lib/api';

export default function FlashcardReview() {
  const theme = useTheme();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState('');

  // Load the due cards each time the tab is opened so that new lectures show up
  // From https://docs.expo.dev/router/reference/hooks/#usefocuseffect -Trent
  useFocusEffect(
    useCallback(() => {
      listDueFlashcards().then(setCards);
    }, []),
  );

  async function answer(gotIt: boolean) {
    try {
      await reviewFlashcard(cards[0], gotIt);
      // Move on to the next card
      setCards(cards.slice(1));
      setFlipped(false);
    } catch (e) {
      setStatus('Failed: ' + (e as Error).message);
    }
  }

  const card = cards[0];

  if (!card) {
    return <ThemedText themeColor="textSecondary">All done for today 🤗</ThemedText>;
  }

  return (
    <View style={styles.box}>
      <ThemedText type="small" themeColor="textSecondary">
        {cards.length} {cards.length === 1 ? 'card' : 'cards'} left today
      </ThemedText>

      <Pressable onPress={() => setFlipped(!flipped)}>
        <ThemedView type={flipped ? 'primarySoft' : 'backgroundElement'} style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary">
            {flipped ? 'Answer' : 'Question. tap to flip'}
          </ThemedText>
          <ThemedText style={styles.cardText}>{flipped ? card.back : card.front}</ThemedText>
        </ThemedView>
      </Pressable>

      <ReadAloud text={flipped ? card.back : card.front} />

      {flipped && (
        <View style={styles.row}>
          <Button title="Again" color={theme.danger} onPress={() => answer(false)} />
          <Button title="Got it" color={theme.success} onPress={() => answer(true)} />
        </View>
      )}

      {!!status && <ThemedText type="small">{status}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: Spacing.three },
  card: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two, minHeight: 180, justifyContent: 'center' },
  cardText: { fontSize: 20, lineHeight: 28, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
});
