import { prisma } from '@/client/prisma';
import { type Prisma } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import {
  asAmericaNewYorkMidnight,
  getAmericaNewYorkYmd,
  getTodayInAmericaNewYorkAsUtcMidnight,
} from '@/utils/dateUtils';
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
 * in America/New_York (EST/EDT) time.
 *
 * @throws {NotFoundError} if no daily challenge is found
 */
export async function getLatestDailyChallenge(): Promise<DailyChallenge> {
  const todayEstAsUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();

  const dailyChallenge = await prisma.dailyChallenge
    .findFirstOrThrow({
      where: { date: { lte: todayEstAsUtcMidnight } },
      orderBy: { date: 'desc' },
      select: DAILY_CHALLENGE_SELECT,
    })
    .catch((error) => {
      if (isNotFoundError(error)) {
        throw new NotFoundError('No daily challenge found');
      }
      throw error;
    });

  return mapToDailyChallenge(dailyChallenge);
}

/**
 * Creates a daily challenge for the given date and generates its puzzles.
 *
 * @throws {AlreadyExistsError} if the daily challenge already exists for the given date.
 */
export async function createDailyChallenge({ date }: { date: Date }): Promise<DailyChallenge> {
  const dailyChallenge = await prisma.dailyChallenge
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

  return mapToDailyChallenge(dailyChallenge);
}

/**
 * Paginated lists of daily challenges where the date is today or before
 */
export async function listDailyChallenges({
  take,
  skip,
  cursor,
}: CursorArgs<{ date: Date }>): Promise<DailyChallenge[]> {
  const todayEstAsUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();

  const dailyChallenges = await prisma.dailyChallenge.findMany({
    take,
    skip,
    cursor,
    orderBy: { date: 'desc' },
    where: { date: { lte: todayEstAsUtcMidnight } },
    select: DAILY_CHALLENGE_SELECT,
  });

  return dailyChallenges.map(mapToDailyChallenge);
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
 * A puzzle is considered "completed" when a UserPuzzleAttempt exists
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

/**
 * Dates (`DailyChallenge.date`, UTC midnight) where the user has a {@link UserPuzzleAttempt}
 * on every puzzle in the challenge, and each attempt's `startedAt` falls on the same
 * America/New_York calendar day as that challenge.
 */
export async function getQualifyingDailyChallengeDatesForUserStreak({
  userId,
}: {
  userId: string;
}): Promise<Date[]> {
  const todayEstAsUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();

  const challenges = await prisma.dailyChallenge.findMany({
    where: { date: { lte: todayEstAsUtcMidnight } },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      puzzles: { select: { id: true } },
    },
  });

  const puzzleIds = [...new Set(challenges.flatMap((c) => c.puzzles.map((p) => p.id)))];
  if (puzzleIds.length === 0) {
    return [];
  }

  const attempts = await prisma.userPuzzleAttempt.findMany({
    where: { userId, puzzleId: { in: puzzleIds } },
    select: { puzzleId: true, startedAt: true },
  });
  const attemptByPuzzleId = new Map(attempts.map((a) => [a.puzzleId, a]));

  const qualifying: Date[] = [];
  for (const c of challenges) {
    if (c.puzzles.length === 0) {
      continue;
    }
    const expectedYmd = getAmericaNewYorkYmd(c.date);
    let fullyAttemptedSameDay = true;
    for (const p of c.puzzles) {
      const att = attemptByPuzzleId.get(p.id);
      if (!att || getAmericaNewYorkYmd(att.startedAt) !== expectedYmd) {
        fullyAttemptedSameDay = false;
        break;
      }
    }
    if (fullyAttemptedSameDay) {
      qualifying.push(c.date);
    }
  }

  return qualifying;
}

function mapToDailyChallenge(
  dailyChallenge: Prisma.DailyChallengeGetPayload<{ select: typeof DAILY_CHALLENGE_SELECT }>,
): DailyChallenge {
  return {
    ...dailyChallenge,
    date: asAmericaNewYorkMidnight(dailyChallenge.date),
  };
}
