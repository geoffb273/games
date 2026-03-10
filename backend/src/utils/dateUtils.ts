const TZ_AMERICA_NEW_YORK = 'America/New_York';

function getHourInAmericaNewYork(date: Date): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ_AMERICA_NEW_YORK,
    hour12: false,
    hour: 'numeric',
  });

  const hourPart = formatter.formatToParts(date).find((part) => part.type === 'hour');
  return Number(hourPart?.value ?? 0);
}

/**
 * Given a date that should be treated as a date-only value (no time),
 * return a Date that represents midnight in America/New_York for that
 * same calendar day.
 *
 * This is useful when reading `@db.Date` fields from the database, which
 * Prisma represents as `DateTime` at midnight UTC.
 */
export function asAmericaNewYorkMidnight(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 0-based -> 1-based
  const day = date.getUTCDate();
  // Use noon UTC to determine the offset for the given calendar day in the target timezone.
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const hourInTimeZone = getHourInAmericaNewYork(noonUtc);

  const offsetHours = (12 - hourInTimeZone + 24) % 24;
  return new Date(Date.UTC(year, month - 1, day, offsetHours, 0, 0));
}
