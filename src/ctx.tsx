import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { supabase } from '@/lib/supabase';

// Taken from https://docs.expo.dev/router/advanced/authentication/
// and modified to work with Supabase auth -Trent

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: Session | null;
  isLoading: boolean;
} | null>(null);

// Use this hook to access the user info.
export function useSession() {
  const value = use(AuthContext);
  if (!value) {
    throw new Error('useSession must be wrapped in a <SessionProvider />');
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load any saved session, then follow sign-in/sign-out. Stack.Protected in
  // app/_layout.tsx shows the home screen as soon as session is set.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => data.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {

        },
        signOut: () => {
          supabase.auth.signOut();
        },
        session,
        isLoading,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
