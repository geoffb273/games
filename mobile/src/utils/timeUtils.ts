const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

/**
 * Formats a duration in milliseconds as a string with seconds at minimum and hours at most.
 * Returns null if durationMs is null, undefined, or <= 0.
 *
 * Examples:
 * - 45000 → "45s"
 * - 125000 → "2m 5s"
 * - 3725000 → "1h 2m 5s"
 */
export function formatDuration(durationMs: number | null | undefined): string | null {
  if (durationMs == null || durationMs <= 0) {
    return null;
  }

  const totalSeconds = Math.floor(durationMs / MS_PER_SECOND);
  const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
  const minutes = Math.floor(
    (totalSeconds % (SECONDS_PER_MINUTE * MINUTES_PER_HOUR)) / SECONDS_PER_MINUTE,
  );
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  parts.push(`${seconds}s`);

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
