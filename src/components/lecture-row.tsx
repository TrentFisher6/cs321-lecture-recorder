import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Card, Icon, icons, T } from '@/components/kit';
import { courses, formatDate, type Lecture } from '@/lib/mock-data';

// A lecture's status plus its verified flag map to one badge.
//
// Best practices:
// - Keep this mapping in one place so every screen shows the same words for the
//   same state. Add new statuses here first.
// - Check states in priority order (error, then not ready, then not verified), so
//   each lecture matches exactly one branch.
export function lectureBadge(l: Lecture) {
  if (l.status === 'error') return <Badge tone="danger" icon={icons.warning} label="Problem" />;
  if (l.status !== 'ready') return <Badge tone="warning" icon={icons.sparkles} label="Making notes" />;
  if (!l.verified) return <Badge tone="warning" label="Needs review" />;
  return <Badge tone="success" icon={icons.check} label="Verified" />;
}

// One tappable row for a lecture in any list.
// - Take the whole lecture as a prop rather than looking it up by id. The row then
//   stays a pure display component and is easy to reuse.
// - The course lookup reads mock data. Once api.ts exists, fetch lectures with
//   their course in one query, or pass the course in, instead of looking it up per row.
// - The row navigates itself, so every list opens lectures the same way.
export function LectureRow({ lecture, showCourse }: { lecture: Lecture; showCourse?: boolean }) {
  const course = courses.find((c) => c.id === lecture.courseId);
  const meta = [showCourse ? course?.code : null, formatDate(lecture.date)].filter(Boolean).join(' · ');
  return (
    <Card
      onPress={() => router.push({ pathname: '/lecture/[id]', params: { id: lecture.id } })}
      accessibilityLabel={`${lecture.title}, ${meta}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <T variant="bodyBold">{lecture.title}</T>
          <T variant="caption" color="textSecondary">
            {meta}
          </T>
          {lectureBadge(lecture)}
        </View>
        <Icon name={icons.chevron} size={18} color="textSecondary" />
      </View>
    </Card>
  );
}
