// Button that reads text out loud, for students who find reading hard. Tap again to stop
// Based on https://docs.expo.dev/versions/v57.0.0/sdk/speech/ -Trent
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Button } from 'react-native';

export default function ReadAloud({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  function toggle() {
    if (speaking) {
      Speech.stop();
      return;
    }
    setSpeaking(true);
    // Trigger show "Read aloud" again
    const done = () => setSpeaking(false);
    Speech.speak(text, { onDone: done, onStopped: done, onError: done });
  }

  return <Button title={speaking ? 'Stop reading' : 'Read aloud'} onPress={toggle} />;
}
