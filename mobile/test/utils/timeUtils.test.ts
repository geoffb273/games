import { formatDuration } from '@/utils/timeUtils';

describe('formatDuration', () => {
  describe('invalid or non-positive input', () => {
    it('returns null for null', () => {
      expect(formatDuration(null)).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(formatDuration(undefined)).toBeNull();
    });

    it('returns null for zero', () => {
      expect(formatDuration(0)).toBeNull();
    });

    it('returns null for negative values', () => {
      expect(formatDuration(-1)).toBeNull();
      expect(formatDuration(-1000)).toBeNull();
    });
  });

  describe('seconds only', () => {
    it('formats whole seconds under one minute', () => {
      expect(formatDuration(45_000)).toBe('45s');
      expect(formatDuration(1_000)).toBe('1s');
      expect(formatDuration(59_000)).toBe('59s');
    });

    it('floors milliseconds so sub-second values become 0s', () => {
      expect(formatDuration(999)).toBe('0s');
      expect(formatDuration(1)).toBe('0s');
    });
  });

  describe('minutes and seconds', () => {
    it('includes minutes when at least one full minute', () => {
      expect(formatDuration(125_000)).toBe('2m 5s');
    });

    it('omits hours when zero and shows 0s when seconds are zero', () => {
      expect(formatDuration(60_000)).toBe('1m 0s');
    });
  });

  describe('hours, minutes, and seconds', () => {
    it('formats composite duration as documented', () => {
      expect(formatDuration(3_725_000)).toBe('1h 2m 5s');
    });

    it('omits zero minutes but still shows seconds', () => {
      expect(formatDuration(3_600_000)).toBe('1h 0s');
    });

    it('includes non-zero minutes under an hour cap in the string', () => {
      expect(formatDuration(3_661_000)).toBe('1h 1m 1s');
    });
  });

  describe('remainder chaining (years → … → seconds)', () => {
    const MS_PER_DAY = 86_400_000;
    const MS_PER_WEEK = 604_800_000;

    it('counts days only after full weeks are removed', () => {
      expect(formatDuration(5 * MS_PER_DAY)).toBe('5d');
    });

    it('shows weeks without inflating hidden day remainder (e.g. 2w + 3d → "2w")', () => {
      expect(formatDuration(2 * MS_PER_WEEK + 3 * MS_PER_DAY)).toBe('2w');
    });
  });
});
