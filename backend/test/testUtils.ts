import { randomUUID } from 'node:crypto';
import { type BaseLogger, type Logger } from 'pino';
import { vi } from 'vitest';

import { prisma } from '@/client/prisma';
import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';
import { type User } from '@/platform/user/resource/user';

/**
 * Creates a deterministic Date value from a UUID.
 *
 * Useful for tests that need stable-but-unique timestamps.
 */
export function createUniqueDateTime(): Date {
  const uuid = randomUUID();

  const normalizedUuid = uuid.replaceAll('-', '');
  const uuidValue = BigInt(`0x${normalizedUuid}`);
  // Keep generated dates in a conservative DB-safe window for tests.
  const minDateMs = BigInt(Date.UTC(1970, 0, 1));
  const maxDateMs = BigInt(Date.UTC(10000, 0, 1));
  const dateRangeMs = maxDateMs - minDateMs;
  const timestamp = minDateMs + (uuidValue % dateRangeMs);

  return new Date(Number(timestamp));
}

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

export function createMockLogger(): Logger {
  const logger: BaseLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    level: 'info',
    msgPrefix: '',
    silent: vi.fn(),
  };
  return {
    ...logger,
    child: vi.fn().mockReturnValue(logger),
  } as unknown as Logger;
}
