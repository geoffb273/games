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
});
