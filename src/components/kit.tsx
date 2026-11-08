// Shared building blocks for the app screens.
// Design rules: large readable text with large touch targets
// Focused on using plain words and set an accessibility control
//
//
// - Everything should build from here, so we can change the look of the whole app in one place.
// 

import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type PropsWithChildren, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconName = SymbolViewProps['name'];

/**  
 * Icons use SF Symbols on iOS and Material Symbols on Android/web. Always give all
 * three names ({ ios, android, web }), or the icon is blank on the missing platform.
 * Icons are decorative: pair them with text, because screen readers skip them. 
 */
export function Icon({ name, size = 22, color = 'text' }: { name: IconName; size?: number; color?: ThemeColor }) {
  const theme = useTheme();
  return <SymbolView name={name} size={size} tintColor={theme[color]} />;
}

/**
 * Pick text by role (title, heading, body), not by size. Do not set fontSize in a
 * screen. Leave allowFontScaling on (the default) so a phone's larger-text setting
 * still works, and check layouts at large text sizes. 
 */
type Variant = 'display' | 'title' | 'heading' | 'body' | 'bodyBold' | 'caption';

export function T({ variant = 'body', color = 'text', style, ...rest }: TextProps & { variant?: Variant; color?: ThemeColor }) {
  const theme = useTheme();
  return <Text style={[text[variant], { color: theme[color] }, style]} {...rest} />;
}

/**
 * Page wrapper.
 * It handles safe areas (notch, home bar) so screens do not have to.
 * For long or growing lists will need to readjust
 */
export function Screen({
  title,
  subtitle,
  right,
  tab,
  footer,
  children,
}: PropsWithChildren<{ title?: string; subtitle?: string; right?: ReactNode; tab?: boolean; footer?: ReactNode }>) {
  const theme = useTheme();
  return (
    <SafeAreaView edges={tab ? ['top'] : ['bottom']} style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingBottom: (tab ? BottomTabInset : 0) + Spacing.five }]}>
        {title ? (
          <View style={styles.pageHeader}>
            <View style={{ flex: 1, gap: Spacing.one }}>
              <T variant="title" accessibilityRole="header">
                {title}
              </T>
              {subtitle ? <T color="textSecondary">{subtitle}</T> : null}
            </View>
            {right}
          </View>
        ) : null}
        {children}
      </ScrollView>
      {footer ? (
        <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>{footer}</View>
      ) : null}
    </SafeAreaView>
  );
}

/* 
 * A card is only pressable when given onPress, so plain cards are not announced as
 * buttons. Pass accessibilityLabel for pressable cards; otherwise a screen reader
 * reads every text inside one by one. 
 */
export function Card({
  children,
  onPress,
  tone = 'backgroundElement',
  style,
  accessibilityLabel,
}: PropsWithChildren<{
  onPress?: () => void;
  tone?: ThemeColor;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}>) {
  const theme = useTheme();
  const body = [styles.card, { backgroundColor: theme[tone] }, style];
  if (!onPress) return <View style={body}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [body, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

/**  
 *Use one `primary` button per screen for the main action. `danger` is for actions
 * that delete or end something, and those should also ask for confirmation.
 * `label` doubles as the accessibility label, so write it as a clear verb phrase. 
 */
type ButtonKind = 'primary' | 'secondary' | 'danger' | 'accent';

export function Button({
  label,
  icon,
  kind = 'primary',
  onPress,
  disabled,
  big,
  style,
}: {
  label: string;
  icon?: IconName;
  kind?: ButtonKind;
  onPress: () => void;
  disabled?: boolean;
  big?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const palette: Record<ButtonKind, [ThemeColor, ThemeColor]> = {
    primary: ['primary', 'onPrimary'],
    secondary: ['backgroundSelected', 'text'],
    danger: ['danger', 'onPrimary'],
    accent: ['accent', 'onAccent'],
  };
  const [bg, fg] = palette[kind];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        big && styles.buttonBig,
        { backgroundColor: theme[bg] },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {icon ? <Icon name={icon} size={big ? 28 : 22} color={fg} /> : null}
      {/* Android bug workaround: a label sized to its own measured width can come
          out a fraction of a pixel too narrow after rounding.*/}
      <T
        variant={big ? 'heading' : 'bodyBold'}
        color={fg}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        textBreakStrategy="simple"
        style={{ flexGrow: 1, flexShrink: 1, textAlign: 'center' }}>
        {label}
      </T>
    </Pressable>
  );
}

// CONSTANTS
// One shared icon map keeps the same meaning on the same icon across screens.
// `satisfies` type-checks every entry while keeping the exact keys for autocomplete.
export const icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  mic: { ios: 'mic.fill', android: 'mic', web: 'mic' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  cards: { ios: 'rectangle.stack.fill', android: 'style', web: 'style' },
  book: { ios: 'book.fill', android: 'menu_book', web: 'menu_book' },
  check: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  chevron: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  pause: { ios: 'pause.fill', android: 'pause', web: 'pause' },
  stop: { ios: 'stop.fill', android: 'stop', web: 'stop' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
} satisfies Record<string, IconName>;


// Body text is 18pt (above the usual 16pt) for readability.
const text = StyleSheet.create({
  display: { fontSize: 56, lineHeight: 64, fontWeight: '700', fontVariant: ['tabular-nums'] },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  heading: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  bodyBold: { fontSize: 18, lineHeight: 26, fontWeight: '600' },
  caption: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
});

const styles = StyleSheet.create({
  scroll: {
    padding: Spacing.three + Spacing.one,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.two },
  footer: { padding: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.two },
  card: { borderRadius: 20, padding: Spacing.three + Spacing.one, gap: Spacing.two },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  button: {
    minHeight: 56,
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  buttonBig: { minHeight: 72, borderRadius: 24 },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.half + 1,
    borderRadius: 999,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  segmented: { flexDirection: 'row', borderRadius: 16, padding: Spacing.one, gap: Spacing.one },
  segment: { flex: 1, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.one },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 48,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: 2,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 56 },
  checkBox: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
