import Auth from '@/components/auth';

// Stack.Protected in app/_layout.tsx switches to the app once Supabase has a session.
export default function SignIn() {
  return <Auth />;
}
