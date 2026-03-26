import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  cachedPuzzleSchema,
  cachedPuzzlesSchema,
  getCachedPuzzle,
  getCachedPuzzles,
  PUZZLE_CACHE_EXPIRATION_MS,
  PUZZLE_CACHE_KEY,
  PUZZLES_CACHE_EXPIRATION_MS,
  PUZZLES_CACHE_KEY,
  setCachedPuzzle,
  setCachedPuzzles,
} from '@/cache/puzzle/puzzle';
import type { Puzzle } from '@/platform/puzzle/resource/puzzle';
import { getJson, setJson } from '@/utils/redis';

import { createMockLogger } from '../../testUtils';

const logger = createMockLogger();

vi.mock('@/client/redis', () => ({
  getRedis: vi.fn(async () => ({})),
}));

vi.mock('@/utils/redis', () => ({
  REDIS_PREFIX: 'game-brain:v1:',
  getJson: vi.fn(),
  setJson: vi.fn(),
}));

function minimalFlowPuzzle(overrides: { id: string; dailyChallengeId: string }): Puzzle {
  const created = new Date('2024-06-01T12:00:00.000Z');
  const updated = new Date('2024-06-02T15:30:00.000Z');
  return {
    id: overrides.id,
    createdAt: created,
    updatedAt: updated,
    dailyChallengeId: overrides.dailyChallengeId,
    name: 'Cached flow',
    description: null,
    type: 'FLOW',
    data: {
      width: 2,
      height: 2,
      pairs: [],
      solution: [
        [0, 0],
        [0, 0],
      ],
    },
  };
}

describe('puzzle cache', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getCachedPuzzle', () => {
    it('returns null when getJson returns null', async () => {
      const id = randomUUID();
      vi.mocked(getJson).mockResolvedValue(null);

      const result = await getCachedPuzzle({ id, logger });

      expect(result).toBeNull();
      expect(getJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLE_CACHE_KEY}:${id}`,
          schema: cachedPuzzleSchema,
        }),
      );
    });

    it('returns the value from getJson', async () => {
      const id = randomUUID();
      const dailyChallengeId = randomUUID();
      const puzzle = minimalFlowPuzzle({ id, dailyChallengeId });
      vi.mocked(getJson).mockResolvedValue(puzzle);

      const result = await getCachedPuzzle({ id, logger });

      expect(result).toEqual(puzzle);
      expect(getJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLE_CACHE_KEY}:${id}`,
          schema: cachedPuzzleSchema,
        }),
      );
    });
  });

  describe('getCachedPuzzles', () => {
    it('returns null when getJson returns null', async () => {
      const dailyChallengeId = randomUUID();
      vi.mocked(getJson).mockResolvedValue(null);

      const result = await getCachedPuzzles({ dailyChallengeId, logger });

      expect(result).toBeNull();
      expect(getJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLES_CACHE_KEY}:${dailyChallengeId}`,
          schema: cachedPuzzlesSchema,
        }),
      );
    });

    it('returns the array from getJson', async () => {
      const dailyChallengeId = randomUUID();
      const id = randomUUID();
      const puzzles: Puzzle[] = [minimalFlowPuzzle({ id, dailyChallengeId })];
      vi.mocked(getJson).mockResolvedValue(puzzles);

      const result = await getCachedPuzzles({ dailyChallengeId, logger });

      expect(result).toEqual(puzzles);
      expect(getJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLES_CACHE_KEY}:${dailyChallengeId}`,
          schema: cachedPuzzlesSchema,
        }),
      );
    });
  });

  describe('setCachedPuzzle', () => {
    it('passes key, value, schema, and TTL to setJson', async () => {
      const id = randomUUID();
      const dailyChallengeId = randomUUID();
      const puzzle = minimalFlowPuzzle({ id, dailyChallengeId });
      vi.mocked(setJson).mockResolvedValue(undefined);

      await setCachedPuzzle({ puzzle });

      expect(setJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLE_CACHE_KEY}:${id}`,
          schema: cachedPuzzleSchema,
          value: puzzle,
          expirationMs: PUZZLE_CACHE_EXPIRATION_MS,
        }),
      );
    });
  });

  describe('setCachedPuzzles', () => {
    it('passes key, value, schema, and TTL to setJson', async () => {
      const dailyChallengeId = randomUUID();
      const id = randomUUID();
      const puzzles: Puzzle[] = [minimalFlowPuzzle({ id, dailyChallengeId })];
      vi.mocked(setJson).mockResolvedValue(undefined);

      await setCachedPuzzles({ dailyChallengeId, puzzles });

      expect(setJson).toHaveBeenCalledWith(
        expect.objectContaining({
          key: `${PUZZLES_CACHE_KEY}:${dailyChallengeId}`,
          schema: cachedPuzzlesSchema,
          value: puzzles,
          expirationMs: PUZZLES_CACHE_EXPIRATION_MS,
        }),
      );
    });

    it('rejects an empty puzzle list (schema min 1)', async () => {
      const dailyChallengeId = randomUUID();
      vi.mocked(setJson).mockImplementation(async ({ schema, value }) => {
        schema.parse(value);
      });

      await expect(setCachedPuzzles({ dailyChallengeId, puzzles: [] })).rejects.toThrow();

      expect(setJson).toHaveBeenCalled();
    });
  });

  describe('cachedPuzzleSchema', () => {
    it('sets description to null when the field is absent', () => {
      const parsed = cachedPuzzleSchema.parse({
        id: 'puzzle-id',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        dailyChallengeId: 'dc-id',
        name: 'n',
        type: 'FLOW',
        data: {
          width: 2,
          height: 2,
          pairs: [],
          solution: [
            [0, 0],
            [0, 0],
          ],
        },
      });

      expect(parsed.description).toBeNullable();
    });
  });

  describe('cachedPuzzlesSchema', () => {
    it('rejects an empty array', () => {
      expect(() => cachedPuzzlesSchema.parse([])).toThrow();
    });

    it('rejects an array containing an invalid puzzle', () => {
      expect(() => cachedPuzzlesSchema.parse([{ broken: true }])).toThrow();
    });

    it('accepts a non-empty array of valid puzzles', () => {
      const parsed = cachedPuzzlesSchema.parse([
        {
          id: 'puzzle-id',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
          dailyChallengeId: 'dc-id',
          name: 'n',
          description: null,
          type: 'FLOW',
          data: {
            width: 2,
            height: 2,
            pairs: [],
            solution: [
              [0, 0],
              [0, 0],
            ],
          },
        },
      ]);

      expect(parsed).toHaveLength(1);
    });
  });
});
