import { AppState, Platform } from 'react-native';

import { createClient } from '@supabase/supabase-js';
import 'expo-sqlite/localStorage/install';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// taken from https://docs.expo.dev/guides/using-supabase/ --Trent
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// We temporarily set up a second client to hold the password while we wait for email 2FA
export const passwordCheck = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'password-check' },
});

// Taken from https://supabase.com/docs/guides/auth/quickstarts/react-native -Trent
// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}