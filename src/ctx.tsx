import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { myRole } from '@/lib/api';
import { supabase } from '@/lib/supabase';

// Taken from https://docs.expo.dev/router/advanced/authentication/
// and modified to work with Supabase auth -Trent

export type Role = 'staff' | 'student';

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: Session | null;
  // The signed-in user's role from the profiles table. null while it loads or when signed out.
  // Screens and tabs read it from here so it is fetched once per sign-in, not per screen.
  role: Role | null;
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
  // The role is stored with the user it belongs to, so a different user never sees it
  const [loadedRole, setLoadedRole] = useState<{ userId: string; role: Role } | null>(null);
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

  // Look up the role whenever a different user signs in. Token refreshes keep the
  // same user id, so they do not refetch.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    myRole()
      .then((r) => !cancelled && setLoadedRole({ userId, role: r === 'staff' ? 'staff' : 'student' }))
      .catch((e) => {
        // Fall back to the role with less access. The database rules still decide
        // what data this user can actually read.
        console.warn('Could not load role', e);
        if (!cancelled) setLoadedRole({ userId, role: 'student' });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const role = loadedRole && loadedRole.userId === userId ? loadedRole.role : null;

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {

        },
        signOut: () => {
          supabase.auth.signOut();
        },
        session,
        role,
        // Keep the splash screen up on launch until the role is known, so the tab
        // bar does not appear and then change.
        isLoading: isLoading || (!!session && role === null),
      }}>
      {children}
    </AuthContext.Provider>
  );
}
