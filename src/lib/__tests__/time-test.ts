// Unit tests for the recording timer and reminder time parsing
import { formatDate, formatDayTime, formatDuration, parseDateOnly, parseReminderTime } from '../time';

describe('parseDateOnly', () => {
  it('reads a database date as a local date, not UTC', () => {
    expect(parseDateOnly('2026-11-20')).toEqual(new Date(2026, 10, 20));
  });

  it('returns null for anything not a date', () => {
    expect(parseDateOnly('soon')).toBeNull();
  });
});

describe('formatDate', () => {
  it('returns empty text when there is no date', () => {
    expect(formatDate(null)).toBe('');
  });

  it('keeps the same calendar day', () => {
    expect(formatDate('2026-11-20')).toContain('20');
  });
});

describe('formatDayTime', () => {
  const now = new Date(2026, 10, 11, 9, 0);

  it('says Today for later today', () => {
    expect(formatDayTime(new Date(2026, 10, 11, 19, 0).toISOString(), now)).toMatch(/^Today, /);
  });

  it('says Tomorrow for tomorrow', () => {
    expect(formatDayTime(new Date(2026, 10, 12, 16, 0).toISOString(), now)).toMatch(/^Tomorrow, /);
  });

  it('names the day for later dates', () => {
    expect(formatDayTime(new Date(2026, 10, 14, 10, 0).toISOString(), now)).not.toMatch(/^(Today|Tomorrow)/);
  });
});

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
