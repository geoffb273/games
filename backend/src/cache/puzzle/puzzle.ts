import { z } from 'zod';

import { getRedis } from '@/client/redis';
import type { Puzzle } from '@/platform/puzzle/resource/puzzle';
import {
  flowPuzzleDataSchema,
  hanjiPuzzleDataSchema,
  hashiPuzzleDataSchema,
  minesweeperPuzzleDataSchema,
  slitherlinkPuzzleDataSchema,
} from '@/platform/puzzle/resource/puzzle';
import { getJson, setJson } from '@/utils/redis';

export const PUZZLE_CACHE_KEY = 'puzzle';
export const PUZZLES_CACHE_KEY = 'puzzles';
export const PUZZLE_CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24 hours
export const PUZZLES_CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24 hours

const puzzleBaseSchema = z.object({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  dailyChallengeId: z.string(),
  name: z.string(),
  description: z.preprocess(
    (val) => (val === undefined ? null : val),
    z.union([z.string(), z.null()]),
  ),
});

/** Schema for a single puzzle document in Redis (matches JSON round-trip from {@link Puzzle}). */
export const cachedPuzzleSchema = z.discriminatedUnion('type', [
  puzzleBaseSchema.extend({
    type: z.literal('FLOW'),
    data: flowPuzzleDataSchema,
  }),
  puzzleBaseSchema.extend({
    type: z.literal('HANJI'),
    data: hanjiPuzzleDataSchema,
  }),
  puzzleBaseSchema.extend({
    type: z.literal('HASHI'),
    data: hashiPuzzleDataSchema,
  }),
  puzzleBaseSchema.extend({
    type: z.literal('MINESWEEPER'),
    data: minesweeperPuzzleDataSchema,
  }),
  puzzleBaseSchema.extend({
    type: z.literal('SLITHERLINK'),
    data: slitherlinkPuzzleDataSchema,
  }),
]);

export const cachedPuzzlesSchema = z.array(cachedPuzzleSchema).min(1);

export async function getCachedPuzzle({ id }: { id: string }): Promise<Puzzle | null> {
  return getJson({
    client: await getRedis(),
    key: `${PUZZLE_CACHE_KEY}:${id}`,
    schema: cachedPuzzleSchema,
  });
}

export async function getCachedPuzzles({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[] | null> {
  return getJson({
    client: await getRedis(),
    key: `${PUZZLES_CACHE_KEY}:${dailyChallengeId}`,
    schema: cachedPuzzlesSchema,
  });
}

export async function setCachedPuzzle({ puzzle }: { puzzle: Puzzle }): Promise<void> {
  await setJson({
    client: await getRedis(),
    key: `${PUZZLE_CACHE_KEY}:${puzzle.id}`,
    schema: cachedPuzzleSchema,
    value: puzzle,
    expirationMs: PUZZLE_CACHE_EXPIRATION_MS,
  });
}

export async function setCachedPuzzles({
  dailyChallengeId,
  puzzles,
}: {
  dailyChallengeId: string;
  puzzles: Puzzle[];
}): Promise<void> {
  await setJson({
    client: await getRedis(),
    key: `${PUZZLES_CACHE_KEY}:${dailyChallengeId}`,
    schema: cachedPuzzlesSchema,
    value: puzzles,
    expirationMs: PUZZLES_CACHE_EXPIRATION_MS,
  });
}
