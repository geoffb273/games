import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { isAlreadyExistsError, isNotFoundError } from '@/utils/errorUtils';
import { type CursorArgs } from '@/utils/paginationUtils';

import { type DailyChallenge } from '../resource/dailyChallenge';

const DAILY_CHALLENGE_SELECT = {
  id: true,
  date: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DailyChallengeSelect;

/**
 * Gets the latest daily challenge where the date is today or before
 *
 * @throws {NotFoundError} if no daily challenge is found
 */
export async function getLatestDailyChallenge(): Promise<DailyChallenge> {
  return prisma.dailyChallenge
    .findFirstOrThrow({
      where: { date: { lte: new Date() } },
      orderBy: { date: 'desc' },
      select: DAILY_CHALLENGE_SELECT,
    })
    .catch((error) => {
      if (isNotFoundError(error)) {
        throw new NotFoundError('No daily challenge found');
      }
      throw error;
    });
}

/**
 * Creates a daily challenge for the given date and generates its puzzles.
 *
 * @throws {AlreadyExistsError} if the daily challenge already exists for the given date.
 */
export async function createDailyChallenge({ date }: { date: Date }): Promise<DailyChallenge> {
  return prisma.dailyChallenge
    .create({
      data: { date },
      select: DAILY_CHALLENGE_SELECT,
    })
    .catch((error) => {
      if (isAlreadyExistsError(error)) {
        throw new AlreadyExistsError(
          `Daily challenge already exists for date ${date.toISOString()}`,
        );
      }
      throw error;
    });
}

/**
 * Paginated lists of daily challenges where the date is today or before
 */
export async function listDailyChallenges({
  take,
  skip,
  cursor,
}: CursorArgs<{ date: Date }>): Promise<DailyChallenge[]> {
  return prisma.dailyChallenge.findMany({
    take,
    skip,
    cursor,
    orderBy: { date: 'desc' },
    where: { date: { lte: new Date() } },
    select: DAILY_CHALLENGE_SELECT,
  });
}

/**
 * Batch-loads the number of puzzles per daily challenge.
 *
 * @returns a map of dailyChallengeId -> puzzle count (missing keys imply 0)
 */
export async function getPuzzleCountsByDailyChallengeIds({
  dailyChallengeIds,
}: {
  dailyChallengeIds: readonly string[];
}): Promise<Map<string, number>> {
  const counts = await prisma.puzzle.groupBy({
    by: ['dailyChallengeId'],
    where: { dailyChallengeId: { in: [...dailyChallengeIds] } },
    _count: { id: true },
  });

  return new Map(counts.map((c) => [c.dailyChallengeId, c._count.id]));
}

/**
 * Batch-loads the number of completed puzzles per daily challenge for a given user.
 *
 * A puzzle is considered "completed" when a UserPuzzleAttempt exists with a non-null completedAt.
 *
 * @returns a map of dailyChallengeId -> completed puzzle count (missing keys imply 0)
 */
export async function getCompletedPuzzleCountsByDailyChallengeIds({
  dailyChallengeIds,
  userId,
}: {
  dailyChallengeIds: readonly string[];
  userId: string;
}): Promise<Map<string, number>> {
  const puzzlesWithCompletedAttempts = await prisma.puzzle.findMany({
    where: {
      dailyChallengeId: { in: [...dailyChallengeIds] },
      attempts: {
        some: {
          userId,
          completedAt: { not: null },
        },
      },
    },
    select: { dailyChallengeId: true },
  });

  return puzzlesWithCompletedAttempts.reduce((map, puzzle) => {
    map.set(puzzle.dailyChallengeId, (map.get(puzzle.dailyChallengeId) ?? 0) + 1);
    return map;
  }, new Map<string, number>());
}
