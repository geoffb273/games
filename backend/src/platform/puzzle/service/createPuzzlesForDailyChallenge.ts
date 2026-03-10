import { generateFlowPuzzleData } from '@/utils/puzzle/flow';
import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';
import { generateHashiPuzzleData } from '@/utils/puzzle/hashi';
import { generateMinesweeperPuzzleData } from '@/utils/puzzle/minesweeper';
import { generateSlitherlinkPuzzleData } from '@/utils/puzzle/slitherlink';

import { createPuzzles } from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

export async function createPuzzlesForDailyChallenge({
  dailyChallengeId,
}: {
  dailyChallengeId: string;
}): Promise<Puzzle[]> {
  const seed = dailyChallengeId;

  const flow = generateFlowPuzzleData({
    width: 8,
    height: 8,
    seed,
  });

  const hanji = generateHanjiPuzzleData({
    width: 8,
    height: 8,
    seed,
    fillProbability: 0.5,
  });

  const hashi = generateHashiPuzzleData({
    width: 10,
    height: 10,
    seed,
    islandCount: 20,
  });

  const minesweeper = generateMinesweeperPuzzleData({
    width: 12,
    height: 12,
    mineCount: 36,
    seed,
  });

  const slitherlink = generateSlitherlinkPuzzleData({
    width: 9,
    height: 9,
    seed,
  });

  return createPuzzles({
    dailyChallengeId,
    data: { flow, hanji, hashi, minesweeper, slitherlink },
  });
}
