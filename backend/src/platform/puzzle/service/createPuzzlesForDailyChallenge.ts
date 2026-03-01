import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';

import { createHanjiPuzzle } from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

export async function createPuzzlesForDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  const seed = dailyChallengeId;

  const data = generateHanjiPuzzleData({
    width: 25,
    height: 25,
    seed,
    fillProbability: 0.5,
  });

  const puzzle = await createHanjiPuzzle({ dailyChallengeId, data });

  return [puzzle];
}
