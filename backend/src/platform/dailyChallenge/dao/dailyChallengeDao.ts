import { prisma } from '@/client/prisma';
import { Prisma, type Prisma as PrismaTypes } from '@/generated/prisma';
import { AlreadyExistsError, NotFoundError } from '@/schema/errors';
import { asAmericaNewYorkMidnight, getTodayInAmericaNewYorkAsUtcMidnight } from '@/utils/dateUtils';
import { isAlreadyExistsError, isNotFoundError } from '@/utils/errorUtils';
import { type CursorArgs } from '@/utils/paginationUtils';

import { type DailyChallenge } from '../resource/dailyChallenge';

const DAILY_CHALLENGE_SELECT = {
  id: true,
  date: true,
  createdAt: true,
  updatedAt: true,
} satisfies PrismaTypes.DailyChallengeSelect;

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

export async function getDailyChallengeMaxStreakForUser({
  userId,
}: {
  userId: string;
}): Promise<number> {
  const todayEstAsUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();
  const [{ maxStreak }] = await prisma.$queryRaw<{ maxStreak: number }[]>(Prisma.sql`
    WITH RECURSIVE qualifying AS (
      SELECT dc."date" AS "challengeDate"
      FROM "DailyChallenge" dc
      JOIN "Puzzle" p ON p."dailyChallengeId" = dc."id"
      LEFT JOIN "UserPuzzleAttempt" upa
        ON upa."puzzleId" = p."id"
       AND upa."userId" = ${userId}::uuid
      WHERE dc."date" <= ${todayEstAsUtcMidnight}::date
      GROUP BY dc."id", dc."date"
      HAVING
        COUNT(*) > 0
        AND COUNT(*) = COUNT(upa."id")
        AND COUNT(*) = COUNT(*) FILTER (
          WHERE (
            (
              (upa."startedAt" AT TIME ZONE 'UTC')
              AT TIME ZONE 'America/New_York'
            )::date
            =
            (
              ((dc."date"::timestamp AT TIME ZONE 'UTC')
              AT TIME ZONE 'America/New_York')
            )::date
          )
        )
    ),
    grouped AS (
      SELECT
        "challengeDate",
        "challengeDate" - ROW_NUMBER() OVER (ORDER BY "challengeDate")::integer AS "runGroup"
      FROM qualifying
    )
    SELECT COALESCE(MAX(runs."runLength"), 0)::integer AS "maxStreak"
    FROM (
      SELECT COUNT(*)::integer AS "runLength"
      FROM grouped
      GROUP BY "runGroup"
    ) runs
  `);

  return maxStreak;
}

export async function getDailyChallengeCurrentStreakForUser({
  userId,
}: {
  userId: string;
}): Promise<number> {
  const todayEstAsUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();
  const [{ currentStreak }] = await prisma.$queryRaw<{ currentStreak: number }[]>(Prisma.sql`
    WITH RECURSIVE qualifying AS (
      SELECT dc."date" AS "challengeDate"
      FROM "DailyChallenge" dc
      JOIN "Puzzle" p ON p."dailyChallengeId" = dc."id"
      LEFT JOIN "UserPuzzleAttempt" upa
        ON upa."puzzleId" = p."id"
       AND upa."userId" = ${userId}::uuid
      WHERE dc."date" <= ${todayEstAsUtcMidnight}::date
      GROUP BY dc."id", dc."date"
      HAVING
        COUNT(*) > 0
        AND COUNT(*) = COUNT(upa."id")
        AND COUNT(*) = COUNT(*) FILTER (
          WHERE (
            (
              (upa."startedAt" AT TIME ZONE 'UTC')
              AT TIME ZONE 'America/New_York'
            )::date
            =
            (
              ((dc."date"::timestamp AT TIME ZONE 'UTC')
              AT TIME ZONE 'America/New_York')
            )::date
          )
        )
    ),
    anchor AS (
      SELECT
        CASE
          WHEN EXISTS (
            SELECT 1 FROM qualifying q WHERE q."challengeDate" = ${todayEstAsUtcMidnight}::date
          ) THEN ${todayEstAsUtcMidnight}::date
          WHEN EXISTS (
            SELECT 1 FROM qualifying q WHERE q."challengeDate" = (${todayEstAsUtcMidnight}::date - 1)
          ) THEN (${todayEstAsUtcMidnight}::date - 1)
          ELSE NULL::date
        END AS "anchorDate"
    ),
    streak AS (
      SELECT a."anchorDate" AS "challengeDate"
      FROM anchor a
      WHERE a."anchorDate" IS NOT NULL
      UNION ALL
      SELECT s."challengeDate" - 1
      FROM streak s
      JOIN qualifying q ON q."challengeDate" = s."challengeDate" - 1
    )
    SELECT COUNT(*)::integer AS "currentStreak"
    FROM streak
  `);

  return currentStreak;
}

function mapToDailyChallenge(
  dailyChallenge: PrismaTypes.DailyChallengeGetPayload<{ select: typeof DAILY_CHALLENGE_SELECT }>,
): DailyChallenge {
  return {
    ...dailyChallenge,
    date: asAmericaNewYorkMidnight(dailyChallenge.date),
  };
}
