// Unit tests for the flashcard spaced repetition math
// Setup from https://docs.expo.dev/develop/unit-testing/ -Trent
import { isDue, nextReview } from '../spaced-repetition';

const now = new Date('2026-11-11T12:00:00');

describe('isDue', () => {
  it('card is due when its never been reviewed', () => {
    expect(isDue(undefined, now)).toBe(true);
  });

  it('card is due after the due date passed', () => {
    expect(isDue({ due_at: '2026-11-10T12:00:00', interval_days: 1 }, now)).toBe(true);
  });

  it('a card is not due if its due date is in the future', () => {
    expect(isDue({ due_at: '2026-11-12T12:00:00', interval_days: 1 }, now)).toBe(false);
  });
});

describe('nextReview', () => {
  it('new cards start at one dayd', () => {
    const { intervalDays, dueAt } = nextReview(undefined, true, now);
    expect(intervalDays).toBe(1);
    expect(dueAt).toEqual(new Date('2026-11-12T12:00:00'));
  });

  it('doubles the wait on "Got it"', () => {
    const { intervalDays, dueAt } = nextReview({ due_at: '', interval_days: 4 }, true, now);
    expect(intervalDays).toBe(8);
    expect(dueAt).toEqual(new Date('2026-11-19T12:00:00'));
  });

  it('resets to 1 day on "Again"', () => {
    expect(nextReview({ due_at: '', interval_days: 8 }, false, now).intervalDays).toBe(1);
  });
});
