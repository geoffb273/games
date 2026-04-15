import { type Logger } from 'pino';

import { createPuzzlesForDailyChallenge } from '@/platform/puzzle/service/puzzleService';
import { type CursorArgs } from '@/utils/paginationUtils';

import {
  createDailyChallenge as createDailyChallengeDao,
  getCompletedPuzzleCountsByDailyChallengeIds as getCompletedPuzzleCountsByDailyChallengeIdsDao,
  getLatestDailyChallenge as getLatestDailyChallengeDao,
  getPuzzleCountsByDailyChallengeIds as getPuzzleCountsByDailyChallengeIdsDao,
  listDailyChallenges as listDailyChallengesDao,
} from '../dao/dailyChallengeDao';
import { type DailyChallenge, type DailyChallengeStreak } from '../resource/dailyChallenge';
import { getDailyChallengeStreakForUser as getDailyChallengeStreakForUserCommand } from './getDailyChallengeStreakForUser';

/**
 * Gets the latest daily challenge
 *
 * @throws {NotFoundError} if no daily challenge is found
 */
export async function getLatestDailyChallenge(): Promise<DailyChallenge> {
  return getLatestDailyChallengeDao();
}

/**
 * Creates a daily challenge for the given date and generates its puzzles.
 *
 * @throws {AlreadyExistsError} if the daily challenge already exists for the given date.
 */
export async function createDailyChallenge({ date }: { date: Date }): Promise<DailyChallenge> {
  const dailyChallenge = await createDailyChallengeDao({ date });
  await createPuzzlesForDailyChallenge(dailyChallenge);
  return dailyChallenge;
}

/**
 * Paginated lists of daily challenges
 */
export async function listDailyChallenges(
  params: CursorArgs<{ date: Date }>,
): Promise<DailyChallenge[]> {
  return listDailyChallengesDao(params);
}

export async function getPuzzleCountsByDailyChallengeIds({
  dailyChallengeIds,
}: {
  dailyChallengeIds: readonly string[];
}): Promise<Map<string, number>> {
  return getPuzzleCountsByDailyChallengeIdsDao({ dailyChallengeIds });
}

/**
 * Gets the completed puzzle counts for the given daily challenge ids and user id.
 *
 * A completed puzzle is a puzzle that has been completed (i.e. the user has solved it or lost).
 */
export async function getCompletedPuzzleCountsByDailyChallengeIds({
  dailyChallengeIds,
  userId,
}: {
  dailyChallengeIds: readonly string[];
  userId: string;
}): Promise<Map<string, number>> {
  return getCompletedPuzzleCountsByDailyChallengeIdsDao({ dailyChallengeIds, userId });
}

/**
 * Gets the daily challenge streak for the given user.
 *
 * Syncs the daily challenge max streak cache if the current streak is greater than the cached max streak.
 */
export async function getDailyChallengeStreakForUser({
  userId,
  logger,
}: {
  userId: string;
  logger: Logger;
}): Promise<DailyChallengeStreak> {
  return getDailyChallengeStreakForUserCommand({ userId, logger });
}
