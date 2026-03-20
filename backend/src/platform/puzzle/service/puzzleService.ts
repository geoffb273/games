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
export async function getPuzzle({ id }: { id: string }): Promise<Puzzle> {
  return getPuzzleDao({ id });
}

/**
 * Gets puzzles by daily challenge id
 *
 * @throws {UnknownError} if for any puzzle the puzzle type is unknown
 * @returns an array of puzzles
 */
export async function getPuzzlesByDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  return getPuzzlesByDailyChallengeDao({ dailyChallengeId });
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
  keys,
}: {
  keys: readonly PuzzleAttemptSpeedPercentageKey[];
}): Promise<Map<string, number>> {
  return getPuzzleAttemptSpeedPercentagesByAttemptDao({ keys });
}

/**
 * Creates puzzles for a daily challenge
 *
 * @throws {UnknownError} if the puzzle type is unknown
 * @returns the created puzzle
 */
export async function createPuzzlesForDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  return createPuzzlesForDailyChallengeCommand({ dailyChallengeId });
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
