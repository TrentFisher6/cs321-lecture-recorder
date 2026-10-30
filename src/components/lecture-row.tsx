import { router } from 'expo-router';
import { View } from 'react-native';

import { Badge, Card, Icon, icons, T } from '@/components/kit';
import { courses, formatDate, type Lecture } from '@/lib/mock-data';

export function lectureBadge(l: Lecture) {
  if (l.status === 'error') return <Badge tone="danger" icon={icons.warning} label="Problem" />;
  if (l.status !== 'ready') return <Badge tone="warning" icon={icons.sparkles} label="Making notes" />;
  if (!l.verified) return <Badge tone="warning" label="Needs review" />;
  return <Badge tone="success" icon={icons.check} label="Verified" />;
}

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
