import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';
import { generateHashiPuzzleData } from '@/utils/puzzle/hashi';
import { generateMinesweeperPuzzleData } from '@/utils/puzzle/minesweeper';

import { createHanjiPuzzle, createHashiPuzzle, createMinesweeperPuzzle } from '../dao/puzzleDao';
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

  const minesweeperData = generateMinesweeperPuzzleData({
    width: 16,
    height: 16,
    mineCount: 40,
    seed,
  });

  const [hanjiPuzzle, hashiPuzzle, minesweeperPuzzle] = await Promise.all([
    createHanjiPuzzle({ dailyChallengeId, data: hanjiData }),
    createHashiPuzzle({ dailyChallengeId, data: hashiData }),
    createMinesweeperPuzzle({ dailyChallengeId, data: minesweeperData }),
  ]);

  return [hanjiPuzzle, hashiPuzzle, minesweeperPuzzle];
}
