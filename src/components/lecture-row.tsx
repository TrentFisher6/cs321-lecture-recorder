import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Card, Icon, icons, T } from '@/components/kit';
import { Spacing } from '@/constants/theme';
import type { Tables } from '@/lib/database.types';
import { formatDate } from '@/lib/time';

// Only the lecture columns the row needs, so lists can pass lectures with or without flashcards
type LectureSummary = Pick<Tables<'lectures'>, 'id' | 'title' | 'date' | 'status' | 'verified'>;

// A lecture's status plus its verified flag map to one badge.
// Statuses are set by the process-lecture function: uploaded, processing, ready, error.
//
// Best practices:
// - Keep this mapping in one place so every screen shows the same words for the
//   same state. Add new statuses here first.
// - Check states in priority order (error, then not ready, then not verified), so
//   each lecture matches exactly one branch.
export function lectureBadge(l: LectureSummary) {
  if (l.status === 'error') return <Badge tone="danger" icon={icons.warning} label="Problem" />;
  if (l.status !== 'ready') return <Badge tone="warning" icon={icons.sparkles} label="Making notes" />;
  if (!l.verified) return <Badge tone="warning" label="Needs review" />;
  return <Badge tone="success" icon={icons.check} label="Verified" />;
}

// One tappable row for a lecture in any list.
// - Take the whole lecture as a prop rather than looking it up by id. The row then
//   stays a pure display component and is easy to reuse.
// - Pass `courseName` in from the screen, which already loaded the courses, instead
//   of looking it up per row.
// - `showStatus` is for staff. Students only ever see verified lectures, so a
//   "Verified" badge on every row would just be noise for them.
// - The row navigates itself, so every list opens lectures the same way.
export function LectureRow({
  lecture,
  courseName,
  showStatus,
}: {
  lecture: LectureSummary;
  courseName?: string;
  showStatus?: boolean;
}) {
  const title = lecture.title ?? 'Lecture';
  const meta = [courseName, formatDate(lecture.date)].filter(Boolean).join(' · ');
  return (
    <Card
      onPress={() => router.push({ pathname: '/lecture/[id]', params: { id: lecture.id, name: title } })}
      accessibilityLabel={[title, meta].filter(Boolean).join(', ')}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
        <View style={{ flex: 1, gap: Spacing.one }}>
          <T variant="bodyBold">{title}</T>
          {meta ? (
            <T variant="caption" color="textSecondary">
              {meta}
            </T>
          ) : null}
          {showStatus ? lectureBadge(lecture) : null}
        </View>
        <Icon name={icons.chevron} size={18} color="textSecondary" />
      </View>
    </Card>
  );
}
