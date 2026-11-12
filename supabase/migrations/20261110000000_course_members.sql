-- Students invited to a course, by email. The student doesn't need an account yet.
-- Policies based on https://supabase.com/docs/guides/database/postgres/row-level-security -Trent
create table course_members (
  course_id uuid references courses on delete cascade not null,
  email text not null,
  invited_by uuid references profiles not null default auth.uid(),
  primary key (course_id, email)
);

alter table course_members enable row level security;

-- Staff can invite students to courses they created and also see the courses
create policy "staff invite to own courses" on course_members
  for insert with check (course_id in (select id from courses where owner_id = auth.uid()));
create policy "staff see their invites" on course_members
  for select using (invited_by = auth.uid());

-- Students see their own invites
create policy "students see own invites" on course_members
  for select using (email = auth.jwt() ->> 'email');

-- Students see the courses they were invited to
create policy "students see invited courses" on courses
  for select using (id in (select course_id from course_members where email = auth.jwt() ->> 'email'));
