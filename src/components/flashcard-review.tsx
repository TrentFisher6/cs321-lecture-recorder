// Review due flashcards one at a time. Tap the card to flip it, then pick "Got it" or "Again"
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';

import ReadAloud from '@/components/read-aloud';
import { listDueFlashcards, reviewFlashcard, type Flashcard } from '@/lib/api';

export default function FlashcardReview() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [status, setStatus] = useState('');

  // Load the due cards once when the screen opens
  useEffect(() => {
    listDueFlashcards().then(setCards);
  }, []);

  async function answer(gotIt: boolean) {
    try {
      await reviewFlashcard(cards[0], gotIt);
      // Move on to the next card
      setCards(cards.slice(1));
      setFlipped(false);
    } catch (e) {
      setStatus('Failed: ' + e);
    }
  }

  const card = cards[0];

  return (
    <View style={styles.box}>
      <Text style={styles.bold}>Flashcards ({cards.length} due)</Text>
      {card ? (
        <>
          <Pressable style={styles.card} onPress={() => setFlipped(!flipped)}>
            <Text>{flipped ? card.back : card.front}</Text>
            <Text style={styles.hint}>{flipped ? 'Answer' : 'Tap to flip'}</Text>
          </Pressable>
          <ReadAloud text={flipped ? card.back : card.front} />
          {flipped && (
            <View style={styles.row}>
              <Button title="Again" onPress={() => answer(false)} />
              <Button title="Got it" onPress={() => answer(true)} />
            </View>
          )}
        </>
      ) : (
        <Text>All done for today.</Text>
      )}
      <Text>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  card: { borderWidth: 1, borderColor: '#86939e', borderRadius: 8, padding: 16, gap: 6 },
  hint: { color: '#86939e', fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  bold: { fontWeight: '600' },
});
