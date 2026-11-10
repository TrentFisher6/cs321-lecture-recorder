// Small time helper. Made into their own component so that we can easily unit test, and avoid code reuse -Trent

// Shows milliseconds as mm:ss for the recording timer
export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Turns a string like "2026-11-20 14:00" into a local Date, or null if it can't be read
export function parseReminderTime(text: string) {
  const trimmed = text.trim();
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) return null;
  const date = new Date(trimmed.replace(' ', 'T'));
  return isNaN(date.getTime()) ? null : date;
}
