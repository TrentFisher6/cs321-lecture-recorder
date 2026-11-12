// Spaced repetition math
// Based on the Leitner system (https://en.wikipedia.org/wiki/Leitner_system):
// "Got it" waits twice as long, "Again" starts over at day 1 -Trent

type Review = { due_at: string; interval_days: number };

// A card with no review yet is due right away
export function isDue(review: Review | undefined, now: Date) {
  return !review || new Date(review.due_at) <= now;
}

// How long it waits after a student finishes the review
export function nextReview(review: Review | undefined, gotIt: boolean, now: Date) {
  const intervalDays = gotIt && review ? review.interval_days * 2 : 1;
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + intervalDays);
  return { intervalDays, dueAt };
}
