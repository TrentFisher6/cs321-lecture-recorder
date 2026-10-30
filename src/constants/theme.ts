/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    // App palette. Primary is Mason green, accent is Mason gold.
    primary: '#006633',
    onPrimary: '#ffffff',
    primarySoft: '#E3F1E8',
    accent: '#FFCC33',
    onAccent: '#1A1A1A',
    accentSoft: '#FFF6D6',
    success: '#1E7B34',
    successSoft: '#E2F4E6',
    warning: '#8A5A00',
    warningSoft: '#FFF0C7',
    danger: '#B3261E',
    dangerSoft: '#FCE4E2',
    border: '#D9DBE0',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#5FC28A',
    onPrimary: '#00210F',
    primarySoft: '#14321F',
    accent: '#FFD45C',
    onAccent: '#1A1A1A',
    accentSoft: '#3A300F',
    success: '#6FD08A',
    successSoft: '#173322',
    warning: '#F2C14E',
    warningSoft: '#3A2E0F',
    danger: '#FF8A80',
    dangerSoft: '#3B1715',
    border: '#3A3D42',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
