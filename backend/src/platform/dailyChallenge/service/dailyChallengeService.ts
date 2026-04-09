import { createPuzzlesForDailyChallenge } from '@/platform/puzzle/service/puzzleService';
import { getTodayInAmericaNewYorkAsUtcMidnight } from '@/utils/dateUtils';
import { type CursorArgs } from '@/utils/paginationUtils';

import {
  createDailyChallenge as createDailyChallengeDao,
  getCompletedPuzzleCountsByDailyChallengeIds as getCompletedPuzzleCountsByDailyChallengeIdsDao,
  getLatestDailyChallenge as getLatestDailyChallengeDao,
  getPuzzleCountsByDailyChallengeIds as getPuzzleCountsByDailyChallengeIdsDao,
  getQualifyingDailyChallengeDatesForUserStreak as getQualifyingDailyChallengeDatesForUserStreakDao,
  listDailyChallenges as listDailyChallengesDao,
} from '../dao/dailyChallengeDao';
import { type DailyChallenge } from '../resource/dailyChallenge';
import {
  computeDailyChallengeStreaks,
  type DailyChallengeStreak,
} from '../resource/dailyChallengeStreak';

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

export async function getDailyChallengeStreakForUser({
  userId,
}: {
  userId: string;
}): Promise<DailyChallengeStreak> {
  const qualifyingChallengeDates = await getQualifyingDailyChallengeDatesForUserStreakDao({
    userId,
  });
  const todayUtcMidnight = getTodayInAmericaNewYorkAsUtcMidnight();
  return computeDailyChallengeStreaks({ qualifyingChallengeDates, todayUtcMidnight });
}
