-- Students only see lectures (and their flashcards) after staff mark them verified -Trent
drop policy "students see invited course lectures" on lectures;
create policy "students see verified course lectures" on lectures
  for select using (
    verified
    and course_id in (select course_id from course_members where email = auth.jwt() ->> 'email')
  );

drop policy "students see invited course flashcards" on flashcards;
create policy "students see verified course flashcards" on flashcards
  for select using (lecture_id in (
    select id from lectures
    where verified
    and course_id in (select course_id from course_members where email = auth.jwt() ->> 'email')
  ));
