const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 604_800_000;
const MS_PER_YEAR = 31_536_000_000;

/**
 * Formats a duration in milliseconds as a coarse human-readable string (years down to seconds).
 * Returns null if durationMs is null or undefined. Negative values are treated as 0.
 *
 * Examples:
 * - 45000 → "45s"
 * - 125000 → "2m 5s"
 * - 3725000 → "1h 2m 5s"
 */
export function formatDuration(durationMs: number | null | undefined): string | null;
export function formatDuration(durationMs: number): string;
export function formatDuration(durationMs: number | null | undefined): string | null {
  if (durationMs == null) {
    return null;
  }
  const nonZeroDurationMs = durationMs > 0 ? durationMs : 0;

  let remainder = nonZeroDurationMs;
  const years = Math.floor(remainder / MS_PER_YEAR);
  remainder %= MS_PER_YEAR;
  const weeks = Math.floor(remainder / MS_PER_WEEK);
  remainder %= MS_PER_WEEK;
  const days = Math.floor(remainder / MS_PER_DAY);
  remainder %= MS_PER_DAY;
  const hours = Math.floor(remainder / MS_PER_HOUR);
  remainder %= MS_PER_HOUR;
  const minutes = Math.floor(remainder / MS_PER_MINUTE);
  remainder %= MS_PER_MINUTE;
  const seconds = Math.floor(remainder / MS_PER_SECOND);

  const showSeconds = years === 0 && weeks === 0 && days === 0 && hours < 10;
  const showMinutes = years === 0 && weeks === 0 && days < 2 && minutes > 0;
  const showHours = years === 0 && weeks === 0 && hours > 0;
  const showDays = years === 0 && weeks === 0 && days > 0;
  const showWeeks = years === 0 && weeks > 0;
  const showYears = years > 0;

  const parts: string[] = [];
  if (showYears) {
    parts.push(`${years}y`);
  }
  if (showWeeks) {
    parts.push(`${weeks}w`);
  }
  if (showDays) {
    parts.push(`${days}d`);
  }
  if (showHours) {
    parts.push(`${hours}h`);
  }
  if (showMinutes) {
    parts.push(`${minutes}m`);
  }
  if (showSeconds) {
    parts.push(`${seconds}s`);
  }

  return parts.join(' ');
}

/** Human-readable calendar date for daily challenge assets (Eastern, matches challenge day). */
export function formatDailyChallengeDate(date: Date): string {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}
