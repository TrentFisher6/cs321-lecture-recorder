import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// Expo starter view with a theme background color.
//
// Best practices:
// - Prefer Card or Screen from kit.tsx in new screens. Use this only for a plain
//   themed background.
// - Pass `style` last in the array (as below), so callers can override the default.
// - lightColor and darkColor are accepted but ignored. Either use them or remove
//   them, so the props do not suggest behavior that does not exist.
export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

export function ThemedView({ style, lightColor, darkColor, type, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  return <View style={[{ backgroundColor: theme[type ?? 'background'] }, style]} {...otherProps} />;
}
