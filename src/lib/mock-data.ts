// TODO: will be replaced with api.ts
// Placeholder data for the first GUI pass. Shapes follow the Supabase tables

export type Role = 'staff' | 'student';
export type LectureStatus = 'uploaded' | 'processing' | 'ready' | 'error';
export type TranscriptLine = { speaker: string; start: number; text: string };
export type Term = { term: string; meaning: string };
export type Notes = { summary: string; keyPoints: string[]; terms: Term[] };
export type StudyStep = { id: string; text: string; done: boolean };
export type StudySection = { id: string; title: string; steps: StudyStep[] };

export type Course = { id: string; code: string; name: string };

export type Lecture = {
  id: string;
  courseId: string;
  title: string;
  date: string; // YYYY-MM-DD
  durationMin: number;
  status: LectureStatus;
  verified: boolean;
  transcript: TranscriptLine[];
  notes: Notes | null;
  studyPlan: StudySection[];
};

export type Flashcard = { id: string; lectureId: string; front: string; back: string };

export type Reminder = {
  id: string;
  title: string;
  remindAt: string; // ISO timestamp
  studentName: string;
  createdBy: Role;
};

export const people = {
  staff: { name: 'Shamini V.' },
  student: { name: 'Jared T.' },
  supportedStudents: ['Jared T.', 'Trent F.', 'Evan A.'],
};

export const courses: Course[] = [
  { id: 'psyc100', code: 'PSYC 100', name: 'Intro to Psychology' },
  { id: 'comm100', code: 'COMM 100', name: 'Public Speaking' },
];

export const lectures: Lecture[] = [
  {
    id: 'l1',
    courseId: 'psyc100',
    title: 'Memory and how we learn',
    date: '2026-10-27',
    durationMin: 48,
    status: 'ready',
    verified: true,
    transcript: [
      { speaker: 'Teacher', start: 4, text: 'Good morning everyone. Today we are talking about memory.' },
    ],
    notes: {
      summary: 'Memory is how the brain saves information. Short-term memory lasts seconds. Long-term memory can last years. Repeating things helps you remember them.',
      keyPoints: [
        'Quiz on Friday',
      ],
      terms: [],
    },
    studyPlan: [
      {
        id: 's1',
        title: 'Before Friday\'s quiz',
        steps: [
          { id: 's1a', text: 'Study', done: true },
        ],
      },
    ],
  },
  {
    id: 'l2',
    courseId: 'psyc100',
    title: 'Sleep and the brain',
    date: '2026-10-29',
    durationMin: 50,
    status: 'processing',
    verified: false,
    transcript: [],
    notes: null,
    studyPlan: [],
  },
];

export const flashcards: Flashcard[] = [
  { id: 'f1', lectureId: 'l1', front: 'What is memory?', back: 'How your brain saves information to use later.' },
  { id: 'f2', lectureId: 'l1', front: 'How long does short-term memory last?', back: 'A few seconds.' },
  { id: 'f3', lectureId: 'l1', front: 'What is long-term memory?', back: 'Memory that holds things for days or years.' },
  { id: 'f4', lectureId: 'l1', front: 'What is rehearsal?', back: 'Repeating information so you remember it.' },
  { id: 'f5', lectureId: 'l4', front: 'What are the three parts of a speech?', back: 'Beginning, middle, and end.' },
  { id: 'f6', lectureId: 'l4', front: 'What happens at the end of a speech?', back: 'Repeat the main idea and say thank you.' },
  { id: 'f7', lectureId: 'l3', front: 'How long should you look at one person?', back: 'About three seconds.' },
];

export const reminders: Reminder[] = [
  { id: 'r1', title: 'Practice memory flashcards', remindAt: at(0, 19), studentName: 'Jared T.', createdBy: 'staff' },
  { id: 'r2', title: 'Study for psychology quiz', remindAt: at(1, 16), studentName: 'Jared T.', createdBy: 'student' },
  { id: 'r3', title: 'Practice hobby speech', remindAt: at(3, 10), studentName: 'Jared T.', createdBy: 'staff' },
  { id: 'r4', title: 'Bring speech notes to class', remindAt: at(2, 9), studentName: 'Jared T.', createdBy: 'staff' },
];

// General formatting functions, reused from prior calendar project.
// Times relative to now so the demo always has "today" and "coming up" items.
function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export function formatDate(ymd: string) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function formatDayTime(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const day =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  return `${day}, ${formatTime(iso)}`;
}

export function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0');
  const ss = String(s).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
