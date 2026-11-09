// All backend calls go through here. Screens should not call supabase directly.
import type { Tables, TablesUpdate } from './database.types';
import { supabase } from './supabase';

export type Course = Tables<'courses'>;
export type Lecture = Tables<'lectures'> & { flashcards: Tables<'flashcards'>[] };
export type Notes = { summary: string; keyPoints: string[]; terms: { term: string; meaning: string }[] };
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
