// Unit tests for the recording timer and reminder time parsing
import { formatDuration, parseReminderTime } from '../time';

describe('formatDuration', () => {
  it('shows zero as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('rounds down partial seconds', () => {
    expect(formatDuration(1999)).toBe('00:01');
  });

  it('rolls seconds into minutes', () => {
    expect(formatDuration(65_000)).toBe('01:05');
  });

  it('keeps counting minutes after an hour', () => {
    expect(formatDuration(75 * 60_000)).toBe('75:00');
  });
});

describe('parseReminderTime', () => {
  it('reads a date and time properly', () => {
    expect(parseReminderTime('2026-11-20 14:00')).toEqual(new Date(2026, 10, 20, 14, 0));
  });

  it('ignores extra spaces', () => {
    expect(parseReminderTime(' 2026-11-20 14:00 ')).toEqual(new Date(2026, 10, 20, 14, 0));
  });

  it('returns null for empty text', () => {
    expect(parseReminderTime('')).toBeNull();
  });

  it('returns null for anytjing not a date', () => {
    expect(parseReminderTime('tomorrow at 2')).toBeNull();
  });
});
