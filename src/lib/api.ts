// All backend calls go through here. Screens should not call supabase directly.
import type { Tables, TablesUpdate } from './database.types';
import { isDue, nextReview } from './spaced-repetition';
import { supabase } from './supabase';

export type Course = Tables<'courses'>;
export type Lecture = Tables<'lectures'> & { flashcards: Tables<'flashcards'>[] };
// todos is missing on lectures processed before it was added
export type Notes = { summary: string; todos?: string[]; keyPoints: string[]; terms: { term: string; meaning: string }[] };
export type Flashcard = Tables<'flashcards'> & { flashcard_reviews: Tables<'flashcard_reviews'>[] };
export type Reminder = Tables<'reminders'>;
export type StudyPlan = { title: string; tasks: string[] }[];
export type TranscriptLine = { speaker: number; start: number; text: string };

async function userId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not signed in');
  return data.user.id;
}

// Create a lecture row and upload its audio to storage at <user id>/<lecture id>.m4a
export async function createLecture(courseId: string, title: string, audio: ArrayBuffer) {
  const owner = await userId();
  const { data: lecture, error } = await supabase
    .from('lectures')
    .insert({ owner_id: owner, course_id: courseId, title })
    .select()
    .single();
  if (error) throw error;

  const path = `${owner}/${lecture.id}.m4a`;
  const upload = await supabase.storage.from('lectures').upload(path, audio, { contentType: 'audio/mp4' });
  if (upload.error) throw upload.error;
  await supabase.from('lectures').update({ audio_path: path }).eq('id', lecture.id);
  return lecture.id;
}

// Transcribe and summarize on the edge function
export async function processLecture(lectureId: string) {
  const { error } = await supabase.functions.invoke('process-lecture', { body: { lectureId } });
  if (error) throw error;
}

// Get the role picked at signup
export async function myRole() {
  const { data, error } = await supabase.from('profiles').select('role').eq('id', await userId()).single();
  if (error) throw error;
  return data.role;
}

// Staff: make a new course
export async function createCourse(name: string) {
  const { error } = await supabase.from('courses').insert({ owner_id: await userId(), name });
  if (error) throw error;
}

// Staff: invite a student by email.
export async function inviteStudent(courseId: string, email: string) {
  const { error } = await supabase.from('course_members').insert({ course_id: courseId, email: email.trim().toLowerCase() });
  if (error) throw error;
}

// Staff get their own courses, students get the ones they were invited to (we use RLS here)
export async function listCourses() {
  const { data, error } = await supabase.from('courses').select().order('name');
  if (error) throw error;
  return data;
}

// Staff edit a lecture (fix notes or transcript, or mark it verified)
export async function updateLecture(id: string, fields: TablesUpdate<'lectures'>) {
  const { error } = await supabase.from('lectures').update(fields).eq('id', id);
  if (error) throw error;
}

// Each lecture comes with its flashcards (joined through flashcards.lecture_id)
// See "Query referenced tables" in https://supabase.com/docs/reference/javascript/select -Trent
export async function listLectures() {
  const { data, error } = await supabase.from('lectures').select('*, flashcards(*)').order('date', { ascending: false });
  if (error) throw error;
  return data;
}

// Flashcards that are due now. A card with no review yet is due right away
export async function listDueFlashcards() {
  const { data, error } = await supabase.from('flashcards').select('*, flashcard_reviews(*)');
  if (error) throw error;
  const now = new Date();
  return data.filter((card) => isDue(card.flashcard_reviews[0], now));
}

// Saves the student's answer. See spaced-repetition.ts
export async function reviewFlashcard(card: Flashcard, gotIt: boolean) {
  const { intervalDays, dueAt } = nextReview(card.flashcard_reviews[0], gotIt, new Date());

  // Upsert makes the review row the first time and updates it after that
  // From https://supabase.com/docs/reference/javascript/upsert -Trent
  const { error } = await supabase.from('flashcard_reviews').upsert(
    { flashcard_id: card.id, student_id: await userId(), due_at: dueAt.toISOString(), interval_days: intervalDays },
    { onConflict: 'flashcard_id,student_id' },
  );
  if (error) throw error;
}

// Staff can enter the email of their students
export async function listInvitedStudents() {
  const { data, error } = await supabase.from('course_members').select('email');
  if (error) throw error;
  // Students can be in more than one course so we dedupe
  return [...new Set(data.map((row) => row.email))];
}

// Staff make reminders for their students
export async function createReminder(studentEmail: string, title: string, remindAt: Date) {
  const { error } = await supabase
    .from('reminders')
    .insert({ student_email: studentEmail, title, remind_at: remindAt.toISOString() });
  if (error) throw error;
}

// RLS decides how reminders are shown
export async function listReminders() {
  const { data, error } = await supabase
    .from('reminders')
    .select()
    .gte('remind_at', new Date().toISOString())
    .order('remind_at');
  if (error) throw error;
  return data;
}

export async function deleteReminder(id: string) {
  const { error } = await supabase.from('reminders').delete().eq('id', id);
  if (error) throw error;
}
