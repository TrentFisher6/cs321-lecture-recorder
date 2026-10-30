import { createContext, use, useState, type PropsWithChildren } from 'react';

import * as mock from '@/lib/mock-data';
import type { Lecture, Reminder, Role } from '@/lib/mock-data';

// Temporary in-memory state for the GUI demo. Replace with src/lib/api.ts and the
// signed-in user's profile role once Supabase wiring lands.

type DemoState = {
  role: Role;
  setRole: (role: Role) => void;
  lectures: Lecture[];
  setVerified: (lectureId: string, verified: boolean) => void;
  toggleStep: (lectureId: string, stepId: string) => void;
  reminders: Reminder[];
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  removeReminder: (id: string) => void;
};

const DemoContext = createContext<DemoState | null>(null);

export function useDemo() {
  const value = use(DemoContext);
  if (!value) throw new Error('useDemo must be wrapped in a <DemoProvider />');
  return value;
}

export function DemoProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role>('staff');
  const [lectures, setLectures] = useState(mock.lectures);
  const [reminders, setReminders] = useState(mock.reminders);

  const updateLecture = (id: string, change: (l: Lecture) => Lecture) =>
    setLectures((all) => all.map((l) => (l.id === id ? change(l) : l)));

  return (
    <DemoContext.Provider
      value={{
        role,
        setRole,
        lectures,
        setVerified: (id, verified) => updateLecture(id, (l) => ({ ...l, verified })),
        toggleStep: (id, stepId) =>
          updateLecture(id, (l) => ({
            ...l,
            studyPlan: l.studyPlan.map((section) => ({
              ...section,
              steps: section.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)),
            })),
          })),
        reminders,
        addReminder: (r) => setReminders((all) => [...all, { ...r, id: `r${Date.now()}` }]),
        removeReminder: (id) => setReminders((all) => all.filter((r) => r.id !== id)),
      }}>
      {children}
    </DemoContext.Provider>
  );
}

/** Lectures the current role may open. Students only see staff-verified notes. */
export function useVisibleLectures() {
  const { role, lectures } = useDemo();
  return role === 'staff' ? lectures : lectures.filter((l) => l.status === 'ready' && l.verified);
}

/** Reminders the current role sees. The demo student is always Maya. */
export function useVisibleReminders() {
  const { role, reminders } = useDemo();
  const list = role === 'staff' ? reminders : reminders.filter((r) => r.studentName === mock.people.student.name);
  return [...list].sort((a, b) => a.remindAt.localeCompare(b.remindAt));
}
