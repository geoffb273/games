import { describe, expect, it } from 'vitest';

import { asAmericaNewYorkMidnight, getTodayInAmericaNewYorkAsUtcMidnight } from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('asAmericaNewYorkMidnight', () => {
    it('converts midnight UTC to midnight America/New_York for winter (EST)', () => {
      const jan15Utc = new Date(Date.UTC(2025, 0, 15, 0, 0, 0));
      const result = asAmericaNewYorkMidnight(jan15Utc);

      expect(result).toEqual(new Date(Date.UTC(2025, 0, 15, 5, 0, 0)));
    });

    it('converts midnight UTC to midnight America/New_York for summer (EDT)', () => {
      const jul15Utc = new Date(Date.UTC(2025, 6, 15, 0, 0, 0));
      const result = asAmericaNewYorkMidnight(jul15Utc);

      // Jul 15, 2025 00:00 EDT = 04:00 UTC same day
      expect(result).toEqual(new Date(Date.UTC(2025, 6, 15, 4, 0, 0)));
    });

    it('uses the calendar day from UTC components (year, month, day only)', () => {
      const jan1Utc = new Date(Date.UTC(2025, 0, 1, 0, 0, 0));
      const result = asAmericaNewYorkMidnight(jan1Utc);

      // Jan 1, 2025 00:00 EST = 05:00 UTC Jan 1
      expect(result).toEqual(new Date(Date.UTC(2025, 0, 1, 5, 0, 0)));
    });
  });

  describe('getTodayInAmericaNewYorkAsUtcMidnight', () => {
    it('returns midnight UTC for the calendar day that is "today" in America/New_York', () => {
      // Jan 15, 2025 15:00 UTC = 10:00 EST → "today" in NY is Jan 15
      const now = new Date(Date.UTC(2025, 0, 15, 15, 0, 0));
      const result = getTodayInAmericaNewYorkAsUtcMidnight(now);

      expect(result).toEqual(new Date(Date.UTC(2025, 0, 15, 0, 0, 0)));
    });

    it('returns same calendar day at midnight UTC when now is early in the day in NY', () => {
      // Jan 15, 2025 07:00 UTC = 02:00 EST → still Jan 15 in NY
      const now = new Date(Date.UTC(2025, 0, 15, 7, 0, 0));
      const result = getTodayInAmericaNewYorkAsUtcMidnight(now);

      expect(result).toEqual(new Date(Date.UTC(2025, 0, 15, 0, 0, 0)));
    });

    it('returns next calendar day at midnight UTC when now is late night in NY (past midnight UTC)', () => {
      // Jan 15, 2025 04:00 UTC = Jan 14 23:00 EST → still Jan 14 in NY
      const now = new Date(Date.UTC(2025, 0, 15, 4, 0, 0));
      const result = getTodayInAmericaNewYorkAsUtcMidnight(now);

      expect(result).toEqual(new Date(Date.UTC(2025, 0, 14, 0, 0, 0)));
    });

    it('uses current time when now is not provided', () => {
      const result = getTodayInAmericaNewYorkAsUtcMidnight();
      expect(result).toBeInstanceOf(Date);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });
  });
});
