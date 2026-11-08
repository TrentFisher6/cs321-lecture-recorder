import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Icon, icons, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useDemo } from '@/demo-store';
import { useTheme } from '@/hooks/use-theme';

// Demo imports (temporary)
import type { Role } from '@/lib/mock-data';


// Demos, mock data, and other componenets need to be used.

// GUI for sign-in. The real Supabase auth from src/components/auth.tsx gets
// wired in by story 1; until then both buttons use the session stub.
export default function SignIn() {
  const { signIn } = useSession();
  const { setRole } = useDemo();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const enter = (role: Role) => {
    setRole(role);
    signIn();
    router.replace('/');
  };

  const inputStyle = [styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.brand}>
          <View style={[styles.logo, { backgroundColor: theme.primary }]}>
            <Icon name={icons.mic} size={40} color="onPrimary" />
          </View>
          <T variant="title" style={{ textAlign: 'center' }} accessibilityRole="header">
            Lecture Recorder
          </T>
          <T color="textSecondary" style={{ textAlign: 'center' }}>
            Notes, flashcards, and reminders for Mason LIFE.
          </T>
        </View>

        <View style={{ gap: Spacing.two }}>
          <T variant="bodyBold">Email</T>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@gmu.edu"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel="Email"
            style={inputStyle}
          />
          <T variant="bodyBold" style={{ marginTop: Spacing.two }}>
            Password
          </T>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoComplete="password"
            accessibilityLabel="Password"
            style={inputStyle}
          />
        </View>

        <Button label="Sign in" onPress={() => enter('staff')} big />

        <View style={[styles.demo, { borderColor: theme.border }]}>
          <T variant="caption" color="textSecondary" style={{ textAlign: 'center' }}>
            Demo: look around without an account
          </T>
          {/* Stacked full-width, not side by side: half-width buttons left too little
              room for the label on some phones and large text sizes. */}
          <Button kind="secondary" label="As staff" onPress={() => enter('staff')} />
          <Button kind="secondary" label="As student" onPress={() => enter('student')} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four, gap: Spacing.four, justifyContent: 'center', width: '100%', maxWidth: 480, alignSelf: 'center' },
  brand: { alignItems: 'center', gap: Spacing.two },
  logo: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.two },
  input: { minHeight: 56, borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.three, fontSize: 18 },
  demo: { gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
});
