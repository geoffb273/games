import { z } from 'zod';

import { getRedis } from '@/client/redis';
import { getJson, setJson } from '@/utils/redis';

export const PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY = 'puzzle-attempt-speed-percentage';

export const PUZZLE_ATTEMPT_SPEED_PERCENTAGE_EXPIRATION_MS = 1000 * 60 * 60 * 24; // 24 hours

export const PUZZLE_ATTEMPT_SPEED_PERCENTAGE_INDIVIDUAL_EXPIRATION_MS = 1000 * 60 * 60; // 1 hour

export const PUZZLE_ATTEMPT_SPEED_PERCENTAGE_SCHEMA = z.record(
  z.string(),
  z.object({
    percentage: z.number(),
    expirationTimestampMs: z.number(),
  }),
);

export async function getCachedPuzzleAttemptSpeedPercentages(): Promise<
  Map<string, { percentage: number; expirationTimestampMs: number }>
> {
  const now = Date.now();
  const cachedValues = await getJson({
    client: await getRedis(),
    key: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY,
    schema: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_SCHEMA,
  });

  if (cachedValues == null) return new Map();

  return new Map(
    Object.entries(cachedValues).reduce((acc, [key, value]) => {
      if (value.expirationTimestampMs > now) {
        acc.set(key, value);
      }
      return acc;
    }, new Map<string, { percentage: number; expirationTimestampMs: number }>()),
  );
}

export async function setCachedPuzzleAttemptSpeedPercentages({
  percentages,
}: {
  percentages: Map<string, { percentage: number; expirationTimestampMs?: number }>;
}) {
  const now = Date.now();
  const entries = Array.from(percentages.entries()).reduce(
    (acc, [key, { percentage, expirationTimestampMs }]) => {
      if (expirationTimestampMs != null && expirationTimestampMs <= now) {
        return acc;
      }

      acc[key] = {
        percentage,
        expirationTimestampMs:
          expirationTimestampMs ?? now + PUZZLE_ATTEMPT_SPEED_PERCENTAGE_INDIVIDUAL_EXPIRATION_MS,
      };
      return acc;
    },
    {} as Record<string, { percentage: number; expirationTimestampMs: number }>,
  );

  await setJson({
    client: await getRedis(),
    key: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_KEY,
    schema: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_SCHEMA,
    value: entries,
    expirationMs: PUZZLE_ATTEMPT_SPEED_PERCENTAGE_EXPIRATION_MS,
  });
}
