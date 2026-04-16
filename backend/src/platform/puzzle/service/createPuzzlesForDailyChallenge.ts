import { setCachedPuzzles } from '@/cache/puzzle/puzzle';
import { type DailyChallenge } from '@/platform/dailyChallenge/resource/dailyChallenge';
import { generateFlowPuzzleData } from '@/utils/puzzle/flow';
import { generateHanjiPuzzleData } from '@/utils/puzzle/hanji';
import { generateHashiPuzzleData } from '@/utils/puzzle/hashi';
import { generateMinesweeperPuzzleData } from '@/utils/puzzle/minesweeper';
import { generateSlitherlinkPuzzleData } from '@/utils/puzzle/slitherlink';

import { createPuzzles } from '../dao/puzzleDao';
import { type Puzzle } from '../resource/puzzle';

const PUZZLE_CONFIGS: {
  flow: { width: number; height: number };
  hanji: { width: number; height: number; fillProbability: number };
  hashi: { width: number; height: number; islandCount: number };
  minesweeper: { width: number; height: number; mineCount: number };
  slitherlink: { width: number; height: number };
}[] = [
  // Monday (easiest) → Sunday (hardest). Row index = (getUTCDay() + 6) % 7
  {
    flow: { width: 6, height: 6 },
    hanji: { width: 6, height: 6, fillProbability: 0.45 },
    hashi: { width: 8, height: 8, islandCount: 14 },
    minesweeper: { width: 8, height: 8, mineCount: 15 },
    slitherlink: { width: 5, height: 6 },
  },
  // Tuesday
  {
    flow: { width: 6, height: 7 },
    hanji: { width: 6, height: 7, fillProbability: 0.475 },
    hashi: { width: 8, height: 8, islandCount: 15 },
    minesweeper: { width: 8, height: 9, mineCount: 17 },
    slitherlink: { width: 6, height: 6 },
  },
  // Wednesday
  {
    flow: { width: 7, height: 8 },
    hanji: { width: 7, height: 7, fillProbability: 0.5 },
    hashi: { width: 8, height: 8, islandCount: 16 },
    minesweeper: { width: 9, height: 9, mineCount: 21 },
    slitherlink: { width: 6, height: 7 },
  },
  // Thursday
  {
    flow: { width: 8, height: 8 },
    hanji: { width: 7, height: 7, fillProbability: 0.5 },
    hashi: { width: 9, height: 9, islandCount: 18 },
    minesweeper: { width: 10, height: 10, mineCount: 25 },
    slitherlink: { width: 7, height: 7 },
  },
  // Friday
  {
    flow: { width: 8, height: 9 },
    hanji: { width: 8, height: 8, fillProbability: 0.55 },
    hashi: { width: 10, height: 10, islandCount: 24 },
    minesweeper: { width: 12, height: 12, mineCount: 28 },
    slitherlink: { width: 7, height: 8 },
  },
  // Saturday
  {
    flow: { width: 9, height: 9 },
    hanji: { width: 8, height: 9, fillProbability: 0.6 },
    hashi: { width: 10, height: 10, islandCount: 30 },
    minesweeper: { width: 12, height: 12, mineCount: 32 },
    slitherlink: { width: 8, height: 9 },
  },
  // Sunday
  {
    flow: { width: 9, height: 10 },
    hanji: { width: 8, height: 9, fillProbability: 0.65 },
    hashi: { width: 10, height: 12, islandCount: 40 },
    minesweeper: { width: 12, height: 12, mineCount: 36 },
    slitherlink: { width: 8, height: 9 },
  },
];

export async function createPuzzlesForDailyChallenge({
  id,
  date,
}: DailyChallenge): Promise<Puzzle[]> {
  const seed = id;
  const {
    flow: flowConfig,
    hanji: hanjiConfig,
    hashi: hashiConfig,
    minesweeper: minesweeperConfig,
    slitherlink: slitherlinkConfig,
  } = PUZZLE_CONFIGS[(date.getUTCDay() + 6) % 7];

  const flow = generateFlowPuzzleData({
    width: flowConfig.width,
    height: flowConfig.height,
    seed,
  });

  const hanji = generateHanjiPuzzleData({
    width: hanjiConfig.width,
    height: hanjiConfig.height,
    seed,
    fillProbability: hanjiConfig.fillProbability,
  });

  const hashi = generateHashiPuzzleData({
    width: hashiConfig.width,
    height: hashiConfig.height,
    seed,
    islandCount: hashiConfig.islandCount,
    oddClueBias: 0.5,
  });

  const minesweeper = generateMinesweeperPuzzleData({
    width: minesweeperConfig.width,
    height: minesweeperConfig.height,
    mineCount: minesweeperConfig.mineCount,
    seed,
  });

  const slitherlink = generateSlitherlinkPuzzleData({
    width: slitherlinkConfig.width,
    height: slitherlinkConfig.height,
    seed,
  });

  const puzzles = await createPuzzles({
    dailyChallengeId: id,
    data: { flow, hanji, hashi, minesweeper, slitherlink },
  });

  void setCachedPuzzles({ dailyChallengeId: id, puzzles });
  return puzzles;
}
