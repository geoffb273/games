import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';
import { generateHashiPuzzleData } from '@/utils/puzzle/hashi';
import { generateMinesweeperPuzzleData } from '@/utils/puzzle/minesweeper';

import { createPuzzles } from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

export async function createPuzzlesForDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  const seed = dailyChallengeId;

  const hanji = generateHanjiPuzzleData({
    width: 25,
    height: 25,
    seed,
    fillProbability: 0.5,
  });

  const hashi = generateHashiPuzzleData({
    width: 13,
    height: 13,
    seed,
    islandCount: 25,
  });

  const minesweeper = generateMinesweeperPuzzleData({
    width: 16,
    height: 16,
    mineCount: 40,
    seed,
  });

  return createPuzzles({
    dailyChallengeId,
    data: { hanji, hashi, minesweeper },
  });
}
