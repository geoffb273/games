import {
  getDailyChallengeToPuzzlesMap as getDailyChallengeToPuzzlesMapDao,
  getPuzzle as getPuzzleDao,
  getPuzzlesByDailyChallenge as getPuzzlesByDailyChallengeDao,
} from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

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
