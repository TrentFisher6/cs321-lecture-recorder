-- Initial schema.
-- Users can see their own stuff. Staff can also see their students' stuff.

-- Store each user and their role
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  role text default 'student', -- 'staff' or 'student'
  supporter_id uuid references profiles -- the staff member helping this student
);

-- Store each course
create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles not null,
  name text not null
);

-- Every lecture
create table lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses on delete cascade not null,
  owner_id uuid references profiles not null,
  title text,
  date date default current_date,
  audio_path text,
  status text default 'uploaded', -- uploaded, processing, ready, error
  transcript jsonb,
  notes jsonb,
  study_plan jsonb,
  verified boolean default false
);

-- Flashcards from a lecture
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid references lectures on delete cascade not null,
  owner_id uuid references profiles not null,
  front text not null,
  back text not null,
  due_at timestamptz default now(),
  interval_days int default 1
);

-- Reminders for a specific student, created by the staff
create table reminders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles not null,
  created_by uuid references profiles not null,
  title text not null,
  remind_at timestamptz not null
);

-- Row level security
alter table profiles enable row level security;
alter table courses enable row level security;
alter table lectures enable row level security;
alter table flashcards enable row level security;
alter table reminders enable row level security;

create policy "see own profile or your students" on profiles
  for select using (id = auth.uid() or supporter_id = auth.uid());
create policy "update own profile" on profiles
  for update using (id = auth.uid());

create policy "own courses" on courses
  for all using (owner_id = auth.uid());
create policy "staff see student courses" on courses
  for select using (owner_id in (select id from profiles where supporter_id = auth.uid()));

create policy "own lectures" on lectures
  for all using (owner_id = auth.uid());
create policy "staff see student lectures" on lectures
  for select using (owner_id in (select id from profiles where supporter_id = auth.uid()));
create policy "staff edit student lectures" on lectures
  for update using (owner_id in (select id from profiles where supporter_id = auth.uid()));

create policy "own flashcards" on flashcards
  for all using (owner_id = auth.uid());
create policy "staff see student flashcards" on flashcards
  for select using (owner_id in (select id from profiles where supporter_id = auth.uid()));

create policy "student or creator" on reminders
  for all using (student_id = auth.uid() or created_by = auth.uid());

-- Make a profile when someone signs up
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name) values (new.id, new.raw_user_meta_data ->> 'name');
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Storage for lecture audio. Files go in a folder named after the user's id.
insert into storage.buckets (id, name, public) values ('lectures', 'lectures', false)
  on conflict do nothing;

create policy "own audio files" on storage.objects
  for all using (bucket_id = 'lectures' and (storage.foldername(name))[1] = auth.uid()::text);
