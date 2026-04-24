import { type Logger } from 'pino';
import { z } from 'zod';

import { getRedis } from '@/client/redis';
import { getJson, setJson } from '@/utils/redis';

const DAILY_CHALLENGE_MAX_STREAK_CACHE_KEY = 'daily-challenge:max-streak:v2';
const DAILY_CHALLENGE_MAX_STREAK_CACHE_EXPIRATION_MS = 1000 * 60 * 60 * 24 * 7; // 1 week
const dailyChallengeMaxStreakSchema = z.object({
  max: z.number(),
});

export async function updateDailyChallengeMaxStreakCache({
  userId,
  max,
}: {
  userId: string;
  max: number;
}): Promise<void> {
  return setJson({
    client: await getRedis(),
    key: `${DAILY_CHALLENGE_MAX_STREAK_CACHE_KEY}:${userId}`,
    schema: dailyChallengeMaxStreakSchema,
    value: { max },
    expirationMs: DAILY_CHALLENGE_MAX_STREAK_CACHE_EXPIRATION_MS,
  });
}

export async function getDailyChallengeMaxStreakCache({
  userId,
  logger,
}: {
  userId: string;
  logger: Logger;
}): Promise<{ max: number } | null> {
  return getJson({
    client: await getRedis(),
    key: `${DAILY_CHALLENGE_MAX_STREAK_CACHE_KEY}:${userId}`,
    schema: dailyChallengeMaxStreakSchema,
    logger,
  });
}
