// Shared building blocks for the app screens.
// Design rules: large readable text, 56pt touch targets, one clear action per card,
// plain words, and an accessibility label on every control.
//
// Best practices:
// - Screens should build from these pieces instead of raw Text/View/Pressable with
//   their own styles. One change here then updates the whole app, and text size,
//   spacing, and contrast stay consistent for students who rely on them.
// - Use theme color names (ThemeColor), never hex codes, so dark mode keeps working.
// - Use spacing from `Spacing` instead of raw numbers, for the same reason.
// - Keep these components presentational: props in, callbacks out. No data
//   fetching or app state in this file. (ReadAloudButton is the one exception: it
//   owns the phone's text-to-speech, which is device behavior, not app data.)
// - If this file grows past a few hundred more lines, split it into
//   components/ui/ with one component per file and an index.ts to re-export them.

import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
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
 * Page wrapper. `tab` screens draw their own big title; pushed screens use the stack header.
 * It handles safe areas (notch, home bar) so screens do not have to.
 * `footer` stays pinned below the scroll area. Use it for the screen's main action,
 * so the action is always reachable without scrolling.
 * For long or growing lists (hundreds of rows), use a FlatList instead: ScrollView
 * renders every child at once.
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
      {/* "handled" lets buttons work while the keyboard is open, for screens with forms.
          From https://reactnative.dev/docs/scrollview#keyboardshouldpersisttaps */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
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
          out a fraction of a pixel too narrow after rounding. Android then wraps
          the last word onto a hidden second line ("As staff" showed as "As").
          Stretching the label across the button (flexGrow) and centering the text
          gives it spare room, so no word gets pushed off. Labels stay on one line
          and shrink slightly if they truly do not fit. */}
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

/**
 * Round icon-only button, e.g. "add" in a page header.
 * `label` is required because there is no visible text. hitSlop grows the touch
 * area past the 48pt circle for users with less precise taps.
 */
export function IconButton({ icon, label, onPress, kind = 'secondary' }: { icon: IconName; label: string; onPress: () => void; kind?: ButtonKind }) {
  const theme = useTheme();
  const bg: ThemeColor = kind === 'primary' ? 'primary' : kind === 'danger' ? 'dangerSoft' : 'backgroundSelected';
  const fg: ThemeColor = kind === 'primary' ? 'onPrimary' : kind === 'danger' ? 'danger' : 'text';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: theme[bg] }, pressed && styles.pressed]}>
      <Icon name={icon} size={22} color={fg} />
    </Pressable>
  );
}

/**
 * Text field with an optional visible label above it. The label also becomes the
 * accessibility label, so screen readers say what the field is for. 18pt text and a
 * 56pt height match the buttons.
 */
export function Input({ label, style, ...rest }: TextInputProps & { label?: string }) {
  const theme = useTheme();
  const field = (
    <TextInput
      placeholderTextColor={theme.textSecondary}
      accessibilityLabel={label ?? rest.placeholder}
      {...rest}
      style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }, style]}
    />
  );
  if (!label) return field;
  return (
    <View style={{ gap: Spacing.one }}>
      <T variant="bodyBold">{label}</T>
      {field}
    </View>
  );
}

// Badges show status. Color is never the only signal: always include a text label,
// for color-blind users and screen readers.
type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

export function Badge({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const theme = useTheme();
  const map: Record<Tone, [ThemeColor, ThemeColor]> = {
    neutral: ['backgroundSelected', 'textSecondary'],
    success: ['successSoft', 'success'],
    warning: ['warningSoft', 'warning'],
    danger: ['dangerSoft', 'danger'],
    primary: ['primarySoft', 'primary'],
  };
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: theme[bg] }]}>
      {icon ? <Icon name={icon} size={14} color={fg} /> : null}
      <T variant="caption" color={fg} style={{ fontWeight: '700' }}>
        {label}
      </T>
    </View>
  );
}

// accessibilityRole="header" lets screen-reader users jump between sections.
export function Section({ title, action, children }: PropsWithChildren<{ title: string; action?: ReactNode }>) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={styles.sectionHeader}>
        <T variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
          {title}
        </T>
        {action}
      </View>
      {children}
    </View>
  );
}

// Every list needs an empty state. The message should say what will appear and
// when, e.g. "Notes show up here after your support staff checks them".
export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message: string }) {
  return (
    <Card style={{ alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five }}>
      <Icon name={icon} size={36} color="textSecondary" />
      <T variant="bodyBold">{title}</T>
      <T color="textSecondary" style={{ textAlign: 'center' }}>
        {message}
      </T>
    </Card>
  );
}

/**
 * Two-to-four option switcher, e.g. Notes / Transcript / Study plan.
 * Controlled component: the parent owns `value` and changes it in `onChange`.
 * The generic K makes TypeScript reject a value that is not one of the options.
 * Past four options the labels get cramped, so use a list or separate screens.
 */
export function Segmented<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string }[];
  value: K;
  onChange: (key: K) => void;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.backgroundElement }]} accessibilityRole="tablist">
      {options.map((o) => {
        const selected = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && { backgroundColor: theme.primary }]}>
            <T variant="bodyBold" color={selected ? 'onPrimary' : 'text'}>
              {o.label}
            </T>
          </Pressable>
        );
      })}
    </View>
  );
}

// Chips are for picking from a few preset choices. They are easier than typing or a
// date picker. Selection is shown three ways (border, fill, checkmark), not color alone.
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        { borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primarySoft : theme.background },
        pressed && styles.pressed,
      ]}>
      {selected ? <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={16} color="primary" /> : null}
      <T variant="bodyBold" color={selected ? 'primary' : 'text'}>
        {label}
      </T>
    </Pressable>
  );
}

// The whole row is the touch target, not just the small box. accessibilityRole
// "checkbox" plus accessibilityState makes screen readers say "checked"/"not checked".
export function Checkbox({ label, checked, onPress }: { label: string; checked: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View
        style={[
          styles.checkBox,
          { borderColor: checked ? theme.success : theme.textSecondary, backgroundColor: checked ? theme.success : 'transparent' },
        ]}>
        {checked ? <Icon name={{ ios: 'checkmark', android: 'check', web: 'check' }} size={18} color="onPrimary" /> : null}
      </View>
      <T style={[{ flex: 1 }, checked && { textDecorationLine: 'line-through', opacity: 0.6 }]}>{label}</T>
    </Pressable>
  );
}

/**
 * Story 10: reads `text` out loud, for students who find reading hard. Tap again to stop.
 * Speech logic is from components/read-aloud.tsx (Trent), based on
 * https://docs.expo.dev/versions/v57.0.0/sdk/speech/
 * - Stops speech already playing (from another button) before starting new speech.
 * - Stops when the screen closes or the text changes (e.g. a flashcard flips).
 * - Plays even when the phone is on silent.
 */
export function ReadAloudButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);

  // The cleanup runs on unmount and whenever `text` changes
  useEffect(() => () => void Speech.stop(), [text]);

  function toggle() {
    Speech.stop();
    if (speaking) return; // onStopped sets speaking back to false
    setSpeaking(true);
    setAudioModeAsync({ playsInSilentMode: true });
    const done = () => setSpeaking(false);
    Speech.speak(text, { onDone: done, onStopped: done, onError: done });
  }

  return (
    <Button
      kind="secondary"
      icon={speaking ? icons.stop : icons.speaker}
      label={speaking ? 'Stop reading' : 'Read aloud'}
      onPress={toggle}
    />
  );
}

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
  speaker: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  school: { ios: 'graduationcap.fill', android: 'school', web: 'school' },
} satisfies Record<string, IconName>;

// StyleSheet.create at module level builds styles once, not on every render.
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
  input: { minHeight: 56, borderWidth: 1, borderRadius: 14, paddingHorizontal: Spacing.three, fontSize: 18 },
});
