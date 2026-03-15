import { randomUUID } from 'node:crypto';

import { prisma } from '@/client/prisma';
import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';
import { type User } from '@/platform/user/resource/user';

/**
 * Creates a test user in the database.
 *
 * Should only be used for testing
 */
export async function createTestUser({
  id = randomUUID(),
  deviceId = randomUUID(),
}: {
  id?: string;
  deviceId?: string;
} = {}): Promise<User> {
  return prisma.user.create({
    data: {
      id,
      deviceId,
    },
  });
}

/**
 * Find or create a test daily challenge in the database.
 *
 * Should only be used for testing
 */
export async function createTestDailyChallenge({
  id = randomUUID(),
  date,
}: {
  id?: string;
  date: Date;
}): Promise<DailyChallenge> {
  return prisma.dailyChallenge.create({
    data: { id, date },
  });
}
