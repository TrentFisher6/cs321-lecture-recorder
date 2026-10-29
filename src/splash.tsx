import { SplashScreen } from 'expo-router';
import { useSession } from './ctx';

// Taken from https://docs.expo.dev/router/advanced/authentication/ -Trent

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hide();
  }

  return null;
}
