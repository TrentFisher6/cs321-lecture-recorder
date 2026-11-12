// Small time helper. Made into their own component so that we can easily unit test, and avoid code reuse -Trent

// Shows milliseconds as mm:ss for the recording timer
export function formatDuration(ms: number) {
  const total = Math.floor(ms / 1000);
  const minutes = String(Math.floor(total / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Shows an ISO timestamp as "Today, 7:00 PM", "Tomorrow, 4:00 PM", or "Saturday, Nov 21, 10:00 AM"
export function formatDayTime(iso: string, now = new Date()) {
  const d = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const day =
    d.toDateString() === now.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  return `${day}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

// Reads a database `date` value like "2026-11-20" as a local date. new Date("2026-11-20")
// would read it as midnight UTC, which is the day before in US time zones.
export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

// Shows a database `date` value like "Fri, Nov 20", or '' if there is none
export function formatDate(value: string | null) {
  const d = value ? parseDateOnly(value) : null;
  return d ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : '';
}

// Turns a string like "2026-11-20 14:00" into a local Date, or null if it can't be read
export function parseReminderTime(text: string) {
  const trimmed = text.trim();
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(trimmed)) return null;
  const date = new Date(trimmed.replace(' ', 'T'));
  return isNaN(date.getTime()) ? null : date;
}
