import { createPuzzlesForDailyChallenge } from '@/platform/puzzle/service/puzzleService';
import { type CursorArgs } from '@/utils/paginationUtils';

import {
  createDailyChallenge as createDailyChallengeDao,
  getCompletedPuzzleCountsByDailyChallengeIds as getCompletedPuzzleCountsByDailyChallengeIdsDao,
  getPuzzleCountsByDailyChallengeIds as getPuzzleCountsByDailyChallengeIdsDao,
  listDailyChallenges as listDailyChallengesDao,
} from '../dao/dailyChallengeDao';
import { type DailyChallenge } from '../resource/dailyChallenge';

/**
 * Creates a daily challenge for the given date and generates its puzzles.
 *
 * @throws {AlreadyExistsError} if the daily challenge already exists for the given date.
 */
export async function createDailyChallenge({ date }: { date: Date }): Promise<DailyChallenge> {
  const dailyChallenge = await createDailyChallengeDao({ date });
  await createPuzzlesForDailyChallenge({ dailyChallengeId: dailyChallenge.id });
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

export async function getCompletedPuzzleCountsByDailyChallengeIds({
  dailyChallengeIds,
  userId,
}: {
  dailyChallengeIds: readonly string[];
  userId: string;
}): Promise<Map<string, number>> {
  return getCompletedPuzzleCountsByDailyChallengeIdsDao({ dailyChallengeIds, userId });
}
