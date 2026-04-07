import { type Logger } from 'pino';

import {
  getCachedPuzzle,
  getCachedPuzzles,
  setCachedPuzzle,
  setCachedPuzzles,
} from '@/cache/puzzle/puzzle';
import {
  getCachedPuzzleAttemptSpeedPercentages,
  setCachedPuzzleAttemptSpeedPercentages,
} from '@/cache/puzzle/puzzleAttemptSpeedPercentage';
import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';
import { serializePuzzleAttemptSpeedPercentageKey } from '@/utils/puzzle/attemptUtil';

import {
  getDailyChallengeToPuzzlesMap as getDailyChallengeToPuzzlesMapDao,
  getPuzzle as getPuzzleDao,
  getPuzzlesByDailyChallenge as getPuzzlesByDailyChallengeDao,
} from '../dao/puzzleDao';
import {
  getPuzzleAttemptSpeedPercentages as getPuzzleAttemptSpeedPercentagesByAttemptDao,
  getUserPuzzleAttemptsByPuzzleIds as getUserPuzzleAttemptsByPuzzleIdsDao,
} from '../dao/userPuzzleAttemptDao';
import { type Puzzle } from '../resource/puzzle';
import {
  type PuzzleAttemptSpeedPercentageKey,
  type UserPuzzleAttempt,
} from '../resource/userPuzzleAttempt';
import { type SolvePuzzleInput } from '../resource/userPuzzleAttempt';
import { type PuzzleHint, type RequestPuzzleHintInput } from '../resource/userPuzzleAttempt';
import { createPuzzlesForDailyChallenge as createPuzzlesForDailyChallengeCommand } from './createPuzzlesForDailyChallenge';
import { requestPuzzleHint as requestPuzzleHintCommand } from './requestPuzzleHint';
import { solvePuzzle as solvePuzzleCommand } from './solvePuzzle';
/**
 * Gets a puzzle by id
 *
 * @throws {NotFoundError} if the puzzle is not found
 * @throws {UnknownError} if the puzzle type is unknown
 */
export async function getPuzzle({ id, logger }: { id: string; logger: Logger }): Promise<Puzzle> {
  const cachedPuzzle = await getCachedPuzzle({ id, logger });

  if (cachedPuzzle != null) {
    return cachedPuzzle;
  }

  const puzzle = await getPuzzleDao({ id });
  void setCachedPuzzle({ puzzle });
  return puzzle;
}

/**
 * Gets puzzles by daily challenge id
 *
 * @throws {UnknownError} if for any puzzle the puzzle type is unknown
 * @returns an array of puzzles
 */
export async function getPuzzlesByDailyChallenge({
  dailyChallengeId,
  logger,
}: {
  logger: Logger;
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  const cachedPuzzles = await getCachedPuzzles({ dailyChallengeId, logger });

  if (cachedPuzzles != null && cachedPuzzles.length > 0) {
    return cachedPuzzles;
  }

  const puzzles = await getPuzzlesByDailyChallengeDao({ dailyChallengeId });
  void setCachedPuzzles({ dailyChallengeId, puzzles });
  return puzzles;
}

/**
 * Gets a map of daily challenge ids to puzzles
 *
 * @throws {UnknownError} if for any puzzle the puzzle type is unknown
 * @returns a map of daily challenge ids to puzzles. If a daily challenge id is not found/has no puzzles, it will not be included in the map
 */
export async function getDailyChallengeToPuzzlesMap({
  dailyChallengeIds,
}: {
  dailyChallengeIds: string[];
}): Promise<Map<string, Puzzle[]>> {
  return getDailyChallengeToPuzzlesMapDao({ dailyChallengeIds });
}

export async function getUserPuzzleAttemptsByPuzzleIds({
  userId,
  puzzleIds,
}: {
  userId: string;
  puzzleIds: readonly string[];
}): Promise<Map<string, UserPuzzleAttempt>> {
  return getUserPuzzleAttemptsByPuzzleIdsDao({ userId, puzzleIds });
}

/**
 * Gets the speed percentages for a given set of puzzle attempt keys
 *
 * @returns a map of puzzle attempt keys to speed percentages
 */
export async function getPuzzleAttemptSpeedPercentages({
  userId,
  keys,
  logger,
}: {
  userId: string;
  keys: readonly PuzzleAttemptSpeedPercentageKey[];
  logger: Logger;
}): Promise<Map<string, number>> {
  if (keys.length === 0) return new Map();

  const cachedPercentages = await getCachedPuzzleAttemptSpeedPercentages({ userId, logger });
  const serializedKeys = keys.map((key) => ({
    key,
    serialized: serializePuzzleAttemptSpeedPercentageKey(key),
  }));
  const keysToFetch = serializedKeys
    .filter(({ serialized }) => !cachedPercentages.has(serialized))
    .map(({ key }) => key);
  const fetchedPercentages = await getPuzzleAttemptSpeedPercentagesByAttemptDao({
    userId,
    keys: keysToFetch,
  });

  if (fetchedPercentages.size > 0) {
    await setCachedPuzzleAttemptSpeedPercentages({
      userId,
      percentages: new Map(
        Array.from(fetchedPercentages.entries()).map(([key, percentage]) => [key, { percentage }]),
      ),
    });
  }

  return serializedKeys.reduce<Map<string, number>>((acc, { serialized }) => {
    const cachedPercentage = cachedPercentages.get(serialized)?.percentage;
    const fetchedPercentage = fetchedPercentages.get(serialized);
    const percentage = cachedPercentage ?? fetchedPercentage;
    if (percentage != null) {
      acc.set(serialized, percentage);
    }
    return acc;
  }, new Map());
}

/**
 * Creates puzzles for a daily challenge
 *
 * @throws {UnknownError} if the puzzle type is unknown
 * @returns the created puzzle
 */
export async function createPuzzlesForDailyChallenge(
  dailyChallenge: DailyChallenge,
): Promise<Puzzle[]> {
  return createPuzzlesForDailyChallengeCommand(dailyChallenge);
}

/**
 * @see {@link solvePuzzleCommand}
 */
export async function solvePuzzle(input: SolvePuzzleInput): Promise<UserPuzzleAttempt> {
  return solvePuzzleCommand(input);
}

/**
 * @see {@link requestPuzzleHintCommand}
 */
export async function requestPuzzleHint(input: RequestPuzzleHintInput): Promise<PuzzleHint> {
  return requestPuzzleHintCommand(input);
}
