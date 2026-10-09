// Date Utilities
// ISO 8601 handling, formatting, relative time

export function formatISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
}

export function parseISO(dateString: string): Date {
  return new Date(dateString);
}

export function isValidISO(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function minutesSince(isoString: string, now: string = new Date().toISOString()): number {
  return (new Date(now).getTime() - new Date(isoString).getTime()) / 60000;
}

export function hoursSince(isoString: string, now: string = new Date().toISOString()): number {
  return minutesSince(isoString, now) / 60;
}

export function daysSince(isoString: string, now: string = new Date().toISOString()): number {
  return hoursSince(isoString, now) / 24;
}

export function addMinutes(isoString: string, minutes: number): string {
  return new Date(new Date(isoString).getTime() + minutes * 60000).toISOString();
}

export function addHours(isoString: string, hours: number): string {
  return addMinutes(isoString, hours * 60);
}

export function addDays(isoString: string, days: number): string {
  return addHours(isoString, days * 24);
}

export function startOfDay(isoString: string): string {
  const date = new Date(isoString);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export function endOfDay(isoString: string): string {
  const date = new Date(isoString);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
}

export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isYesterday(isoString: string): boolean {
  const date = new Date(isoString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export function timeAgo(isoString: string, now: string = new Date().toISOString()): string {
  const minutes = minutesSince(isoString, now);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 7) return `${Math.floor(days)}d ago`;
  return formatDate(isoString);
}

export const formatTimeAgo = timeAgo;

export function formatDate(isoString: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return new Date(isoString).toLocaleDateString(undefined, options);
}

export function formatTime(isoString: string, options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }): string {
  return new Date(isoString).toLocaleTimeString(undefined, options);
}

export function formatDateTime(isoString: string): string {
  return `${formatDate(isoString)} at ${formatTime(isoString)}`;
}

export function formatRelative(isoString: string): string {
  if (isToday(isoString)) return `Today at ${formatTime(isoString)}`;
  if (isYesterday(isoString)) return `Yesterday at ${formatTime(isoString)}`;
  return formatDateTime(isoString);
}

export function getTimeRange(range: '24h' | '7d' | '30d'): { start: string; end: string } {
  const end = new Date().toISOString();
  let start: string;
  switch (range) {
    case '24h':
      start = addHours(end, -24);
      break;
    case '7d':
      start = addDays(end, -7);
      break;
    case '30d':
      start = addDays(end, -30);
      break;
  }
  return { start, end };
}