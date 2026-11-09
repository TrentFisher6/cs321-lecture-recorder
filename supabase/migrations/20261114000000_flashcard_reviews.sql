-- Each student's own review schedule for each flashcard (spaced repetition) --Trent
create table flashcard_reviews (
  flashcard_id uuid references flashcards on delete cascade not null,
  student_id uuid references profiles not null default auth.uid(),
  due_at timestamptz not null default now(),
  interval_days int not null default 1,
  primary key (flashcard_id, student_id)
);

alter table flashcard_reviews enable row level security;

create policy "own reviews" on flashcard_reviews
  for all using (student_id = auth.uid());
