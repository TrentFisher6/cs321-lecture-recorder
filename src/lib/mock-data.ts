// Placeholder data for the first GUI pass. Shapes follow the Supabase tables
// (see docs/dataDictionary.md) so screens can switch to src/lib/api.ts later.

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
  staff: { name: 'Shamini' },
  student: { name: 'Jared Traggic' },
  supportedStudents: ['Jared Traggic', 'Trent Fischer', 'Evan Andreas'],
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
      { speaker: 'Teacher', start: 15, text: 'Memory is how your brain saves information so you can use it later.' },
      { speaker: 'Teacher', start: 41, text: 'There are two big kinds. Short-term memory holds things for a few seconds.' },
      { speaker: 'Teacher', start: 63, text: 'Long-term memory can hold things for years, like your best friend\'s birthday.' },
      { speaker: 'Student', start: 92, text: 'Is that why I forget a phone number right after I hear it?' },
      { speaker: 'Teacher', start: 99, text: 'Exactly. It was only in short-term memory. Repeating it helps move it to long-term memory.' },
      { speaker: 'Teacher', start: 131, text: 'Saying something again and again is called rehearsal.' },
      { speaker: 'Teacher', start: 158, text: 'For the quiz on Friday, know the two kinds of memory and one way to help you remember.' },
    ],
    notes: {
      summary: 'Memory is how the brain saves information. Short-term memory lasts seconds. Long-term memory can last years. Repeating things helps you remember them.',
      keyPoints: [
        'Memory saves information so you can use it later.',
        'Short-term memory holds things for a few seconds.',
        'Long-term memory holds things for a long time.',
        'Repeating information (rehearsal) helps move it to long-term memory.',
        'Quiz on Friday: know both kinds of memory and one way to remember.',
      ],
      terms: [
        { term: 'Short-term memory', meaning: 'Memory that holds information for a few seconds.' },
        { term: 'Long-term memory', meaning: 'Memory that holds information for days or years.' },
        { term: 'Rehearsal', meaning: 'Repeating information so you remember it.' },
      ],
    },
    studyPlan: [
      {
        id: 's1',
        title: 'Before Friday\'s quiz',
        steps: [
          { id: 's1a', text: 'Read the key points out loud', done: true },
          { id: 's1b', text: 'Practice the memory flashcards', done: false },
          { id: 's1c', text: 'Explain short-term memory to a friend', done: false },
        ],
      },
      {
        id: 's2',
        title: 'Practice with your support staff',
        steps: [
          { id: 's2a', text: 'Try remembering a phone number using rehearsal', done: false },
          { id: 's2b', text: 'Make one example for each kind of memory', done: false },
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
  {
    id: 'l3',
    courseId: 'comm100',
    title: 'Making eye contact',
    date: '2026-10-28',
    durationMin: 45,
    status: 'ready',
    verified: false,
    transcript: [
      { speaker: 'Teacher', start: 6, text: 'Today we practice eye contact when giving a speech.' },
      { speaker: 'Teacher', start: 22, text: 'Look at one person for about three seconds, then move to someone else.' },
      { speaker: 'Teacher', start: 47, text: 'If looking at eyes feels hard, you can look at foreheads. The audience cannot tell.' },
      { speaker: 'Teacher', start: 80, text: 'Next week each of you gives a one-minute speech about a hobby.' },
    ],
    notes: {
      summary: 'Good eye contact helps your audience feel included. Look at one person for about three seconds, then move on.',
      keyPoints: [
        'Look at one person for about three seconds, then switch.',
        'Looking at foreheads is a good trick if eyes feel hard.',
        'Next week: give a one-minute speech about a hobby.',
      ],
      terms: [{ term: 'Eye contact', meaning: 'Looking at the people you are talking to.' }],
    },
    studyPlan: [
      {
        id: 's3',
        title: 'Get ready for your speech',
        steps: [
          { id: 's3a', text: 'Pick a hobby to talk about', done: false },
          { id: 's3b', text: 'Write three things to say about it', done: false },
          { id: 's3c', text: 'Practice in a mirror for one minute', done: false },
        ],
      },
    ],
  },
  {
    id: 'l4',
    courseId: 'comm100',
    title: 'Planning a short speech',
    date: '2026-10-21',
    durationMin: 47,
    status: 'ready',
    verified: true,
    transcript: [
      { speaker: 'Teacher', start: 3, text: 'A short speech has three parts: a beginning, a middle, and an end.' },
      { speaker: 'Teacher', start: 30, text: 'The beginning tells people what you will talk about.' },
      { speaker: 'Teacher', start: 55, text: 'The end repeats your main idea and says thank you.' },
    ],
    notes: {
      summary: 'A short speech has a beginning, a middle, and an end.',
      keyPoints: [
        'Beginning: say what you will talk about.',
        'Middle: give two or three details.',
        'End: repeat the main idea and say thank you.',
      ],
      terms: [{ term: 'Main idea', meaning: 'The most important thing you want people to remember.' }],
    },
    studyPlan: [
      {
        id: 's4',
        title: 'Practice',
        steps: [
          { id: 's4a', text: 'Write a beginning sentence for your hobby speech', done: true },
          { id: 's4b', text: 'Write an ending sentence', done: false },
        ],
      },
    ],
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

// Times relative to now so the demo always has "today" and "coming up" items.
function at(daysFromNow: number, hour: number, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const reminders: Reminder[] = [
  { id: 'r1', title: 'Practice memory flashcards', remindAt: at(0, 19), studentName: 'Maya Rivera', createdBy: 'staff' },
  { id: 'r2', title: 'Study for psychology quiz', remindAt: at(1, 16), studentName: 'Maya Rivera', createdBy: 'student' },
  { id: 'r3', title: 'Practice hobby speech', remindAt: at(3, 10), studentName: 'Maya Rivera', createdBy: 'staff' },
  { id: 'r4', title: 'Bring speech notes to class', remindAt: at(2, 9), studentName: 'Jordan Lee', createdBy: 'staff' },
];

// Lines that appear one by one on the Record screen to simulate a live transcript.
export const liveScript: { speaker: string; text: string }[] = [
  { speaker: 'Teacher', text: 'Okay, let\'s get started. Today is about sleep and the brain.' },
  { speaker: 'Teacher', text: 'Most adults need seven to nine hours of sleep each night.' },
  { speaker: 'Teacher', text: 'While you sleep, your brain sorts and saves what you learned that day.' },
  { speaker: 'Student', text: 'So pulling an all-nighter is bad for studying?' },
  { speaker: 'Teacher', text: 'Yes. Sleep helps move information into long-term memory.' },
  { speaker: 'Teacher', text: 'There are stages of sleep. The deepest stage helps your body rest.' },
  { speaker: 'Teacher', text: 'Dreams happen mostly in a stage called REM sleep.' },
  { speaker: 'Teacher', text: 'For homework, keep a sleep journal for three nights.' },
];

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
