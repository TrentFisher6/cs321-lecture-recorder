-- Students can see flashcards for lectures in courses they were invited to
-- Same email match as the course_members policies -Trent
create policy "students see invited course flashcards" on flashcards
  for select using (lecture_id in (
    select id from lectures
    where course_id in (select course_id from course_members where email = auth.jwt() ->> 'email')
  ));
