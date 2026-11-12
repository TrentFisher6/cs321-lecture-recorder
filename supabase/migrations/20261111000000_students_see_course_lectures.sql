-- Students can see lectures in courses they were invited to
-- Same email match as the course_members policies -Trent
create policy "students see invited course lectures" on lectures
  for select using (course_id in (select course_id from course_members where email = auth.jwt() ->> 'email'));
