-- Initial schema: see docs/ARCHITECTURE.md ("Data").
-- Access rule: you can see your own rows, and staff can see rows owned by students they support.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default '',
  role text not null default 'student' check (role in ('staff', 'student')),
  supporter_id uuid references profiles on delete set null
);

create table courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references profiles on delete cascade,
  name text not null
);

create table lectures (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses on delete cascade,
  owner_id uuid not null default auth.uid() references profiles on delete cascade,
  title text not null default '',
  date date not null default current_date,
  audio_path text,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'error')),
  transcript jsonb,
  notes jsonb,
  study_plan jsonb,
  verified boolean not null default false
);

create table flashcards (
  id uuid primary key default gen_random_uuid(),
  lecture_id uuid not null references lectures on delete cascade,
  owner_id uuid not null default auth.uid() references profiles on delete cascade,
  front text not null,
  back text not null,
  due_at timestamptz not null default now(),
  interval_days int not null default 1
);

create table reminders (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles on delete cascade,
  created_by uuid not null default auth.uid() references profiles on delete cascade,
  title text not null,
  remind_at timestamptz not null
);

-- True if the current user is `owner` or is `owner`'s support staff.
-- security definer so it can read profiles without recursing into profiles' own policy.
create function can_access(owner uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select owner = auth.uid()
    or exists (select 1 from public.profiles where id = owner and supporter_id = auth.uid());
$$;

alter table profiles enable row level security;
alter table courses enable row level security;
alter table lectures enable row level security;
alter table flashcards enable row level security;
alter table reminders enable row level security;

create policy "profiles: self or supported" on profiles for select using (can_access(id));
create policy "profiles: update self" on profiles for update using (id = auth.uid());

create policy "courses: access" on courses for all using (can_access(owner_id)) with check (can_access(owner_id));
create policy "lectures: access" on lectures for all using (can_access(owner_id)) with check (can_access(owner_id));
create policy "flashcards: access" on flashcards for all using (can_access(owner_id)) with check (can_access(owner_id));
create policy "reminders: access" on reminders for all using (can_access(student_id)) with check (can_access(student_id));

-- Create a profile row whenever someone signs up.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name) values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Private bucket for lecture audio. Files live at `<owner user id>/<lecture id>.m4a`.
insert into storage.buckets (id, name, public) values ('lectures', 'lectures', false);

create policy "lecture audio: access" on storage.objects for all
  using (bucket_id = 'lectures' and can_access(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'lectures' and can_access(((storage.foldername(name))[1])::uuid));
