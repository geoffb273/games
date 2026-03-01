import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';
import { generateHashiPuzzleData } from '@/utils/puzzle/hashi';

import { createHanjiPuzzle, createHashiPuzzle } from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

export async function createPuzzlesForDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  const seed = dailyChallengeId;

  const hanjiData = generateHanjiPuzzleData({
    width: 25,
    height: 25,
    seed,
    fillProbability: 0.5,
  });

  const hashiData = generateHashiPuzzleData({
    width: 13,
    height: 13,
    seed,
    islandCount: 25,
  });

  const [hanjiPuzzle, hashiPuzzle] = await Promise.all([
    createHanjiPuzzle({ dailyChallengeId, data: hanjiData }),
    createHashiPuzzle({ dailyChallengeId, data: hashiData }),
  ]);

  return [hanjiPuzzle, hashiPuzzle];
}
