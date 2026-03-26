import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCachedPuzzleAttemptSpeedPercentages,
  PUZZLE_ATTEMPT_SPEED_PERCENTAGE_EXPIRATION_MS,
  PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY,
  PUZZLE_ATTEMPT_SPEED_PERCENTAGE_SCHEMA,
  setCachedPuzzleAttemptSpeedPercentages,
} from '@/cache/puzzle/puzzleAttemptSpeedPercentage';
import { createMockLogger } from '@/test/testUtils';

const logger = createMockLogger();

const { cacheStore, getJsonMock, setJsonMock } = vi.hoisted(() => {
  const memoryCache = new Map<string, unknown>();

  return {
    cacheStore: memoryCache,
    getJsonMock: vi.fn(async ({ key }: { key: string }) => {
      return (memoryCache.get(key) ?? null) as unknown;
    }),
    setJsonMock: vi.fn(async ({ key, value }: { key: string; value: unknown }) => {
      memoryCache.set(key, value);
    }),
  };
});

vi.mock('@/utils/redis', () => ({
  REDIS_PREFIX: 'game-brain:v1:',
  getJson: getJsonMock,
  setJson: setJsonMock,
}));

describe('puzzleAttemptSpeedPercentage cache', () => {
  beforeEach(() => {
    cacheStore.clear();
    getJsonMock.mockClear();
    setJsonMock.mockClear();
  });

  describe('getCachedPuzzleAttemptSpeedPercentages', () => {
    it('returns an empty Map when there is no cached payload', async () => {
      const userId = randomUUID();
      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });

      expect(result).toEqual(new Map());
      expect(getJsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY}:${userId}`,
          schema: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_SCHEMA,
        }),
      );
    });

    it('drops entries whose expirationTimestampMs is not after now', async () => {
      const userId = randomUUID();
      const t = Date.now();
      cacheStore.set(`${PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY}:${userId}`, {
        expired: { percentage: 1, expirationTimestampMs: t },
        stale: { percentage: 2, expirationTimestampMs: t - 1 },
        ok: { percentage: 99, expirationTimestampMs: t + 60_000 },
      });

      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });

      expect(result.size).toBe(1);
      expect(result.get('ok')).toEqual({
        percentage: 99,
        expirationTimestampMs: t + 60_000,
      });
    });

    it('returns all entries when every expirationTimestampMs is in the future', async () => {
      const t = Date.now();
      const userId = randomUUID();
      cacheStore.set(`${PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY}:${userId}`, {
        a: { percentage: 10, expirationTimestampMs: t + 1000 },
        b: { percentage: 20, expirationTimestampMs: t + 2000 },
      });

      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });

      expect(result.size).toBe(2);
      expect(result.get('a')).toEqual({
        percentage: 10,
        expirationTimestampMs: t + 1000,
      });
      expect(result.get('b')).toEqual({
        percentage: 20,
        expirationTimestampMs: t + 2000,
      });
    });
  });

  describe('setCachedPuzzleAttemptSpeedPercentages', () => {
    it('writes entries and getCached returns them before they expire', async () => {
      const t = Date.now();
      const userId = randomUUID();
      await setCachedPuzzleAttemptSpeedPercentages({
        userId,
        percentages: new Map([['puzzle-1', { percentage: 42, expirationTimestampMs: t + 60_000 }]]),
      });

      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });

      expect(result.size).toBe(1);
      expect(result.get('puzzle-1')).toEqual({
        percentage: 42,
        expirationTimestampMs: t + 60_000,
      });
    });

    it('defaults expirationTimestampMs to one hour after now when omitted', async () => {
      const before = Date.now();
      const userId = randomUUID();
      await setCachedPuzzleAttemptSpeedPercentages({
        userId,
        percentages: new Map([['puzzle-1', { percentage: 33 }]]),
      });

      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });
      const entry = result.get('puzzle-1');

      expect(entry).toBeDefined();
      expect(entry!.percentage).toBe(33);
      const expected = before + 1000 * 60 * 60;
      expect(Math.abs(entry!.expirationTimestampMs - expected)).toBeLessThan(50);
    });

    it('does not store entries whose expirationTimestampMs is not after now', async () => {
      const t = Date.now();
      const userId = randomUUID();
      await setCachedPuzzleAttemptSpeedPercentages({
        userId,
        percentages: new Map([
          ['gone', { percentage: 1, expirationTimestampMs: t }],
          ['alsoGone', { percentage: 2, expirationTimestampMs: t - 1 }],
        ]),
      });

      const result = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });

      expect(result.size).toBe(0);
    });

    it('passes key, value, schema, and TTL to setJson', async () => {
      const t = Date.now();
      const userId = randomUUID();
      await setCachedPuzzleAttemptSpeedPercentages({
        userId,
        percentages: new Map([['x', { percentage: 1, expirationTimestampMs: t + 1000 }]]),
      });

      expect(setJsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY}:${userId}`,
          expirationMs: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_EXPIRATION_MS,
          value: {
            x: {
              percentage: 1,
              expirationTimestampMs: t + 1000,
            },
          },
        }),
      );
    });
  });
});
