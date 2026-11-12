-- Reminders go to a student by email -Trent
drop policy "student or creator" on reminders;
alter table reminders drop column student_id;
alter table reminders add column student_email text not null;
alter table reminders alter column created_by set default auth.uid();

-- Staff manage the reminders they made
create policy "staff manage own reminders" on reminders
  for all using (created_by = auth.uid());

-- Students see reminders sent to the email they signed in with
create policy "students see their reminders" on reminders
  for select using (student_email = auth.jwt() ->> 'email');
