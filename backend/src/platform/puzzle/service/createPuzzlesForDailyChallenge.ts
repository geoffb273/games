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
  flow: { size: number };
  hanji: { size: number; fillProbability: number };
  hashi: { size: number; islandCount: number };
  minesweeper: { size: number; mineCount: number };
  slitherlink: { size: number };
}[] = [
  // Monday (easiest) → Sunday (hardest). Row index = (getUTCDay() + 6) % 7
  {
    flow: { size: 6 },
    hanji: { size: 6, fillProbability: 0.45 },
    hashi: { size: 8, islandCount: 14 },
    minesweeper: { size: 9, mineCount: 15 },
    slitherlink: { size: 5 },
  },
  // Tuesday
  {
    flow: { size: 7 },
    hanji: { size: 6, fillProbability: 0.475 },
    hashi: { size: 8, islandCount: 15 },
    minesweeper: { size: 9, mineCount: 15 },
    slitherlink: { size: 6 },
  },
  // Wednesday
  {
    flow: { size: 8 },
    hanji: { size: 7, fillProbability: 0.5 },
    hashi: { size: 8, islandCount: 16 },
    minesweeper: { size: 10, mineCount: 20 },
    slitherlink: { size: 6 },
  },
  // Thursday
  {
    flow: { size: 8 },
    hanji: { size: 7, fillProbability: 0.5 },
    hashi: { size: 9, islandCount: 18 },
    minesweeper: { size: 10, mineCount: 20 },
    slitherlink: { size: 7 },
  },
  // Friday
  {
    flow: { size: 8 },
    hanji: { size: 8, fillProbability: 0.55 },
    hashi: { size: 10, islandCount: 24 },
    minesweeper: { size: 12, mineCount: 28 },
    slitherlink: { size: 8 },
  },
  // Saturday
  {
    flow: { size: 9 },
    hanji: { size: 8, fillProbability: 0.6 },
    hashi: { size: 10, islandCount: 30 },
    minesweeper: { size: 12, mineCount: 32 },
    slitherlink: { size: 8 },
  },
  // Sunday
  {
    flow: { size: 10 },
    hanji: { size: 9, fillProbability: 0.65 },
    hashi: { size: 12, islandCount: 48 },
    minesweeper: { size: 12, mineCount: 36 },
    slitherlink: { size: 9 },
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
    width: flowConfig.size,
    height: flowConfig.size,
    seed,
  });

  const hanji = generateHanjiPuzzleData({
    width: hanjiConfig.size,
    height: hanjiConfig.size,
    seed,
    fillProbability: hanjiConfig.fillProbability,
  });

  const hashi = generateHashiPuzzleData({
    width: hashiConfig.size,
    height: hashiConfig.size,
    seed,
    islandCount: hashiConfig.islandCount,
    oddClueBias: 0.5,
  });

  const minesweeper = generateMinesweeperPuzzleData({
    width: minesweeperConfig.size,
    height: minesweeperConfig.size,
    mineCount: minesweeperConfig.mineCount,
    seed,
  });

  const slitherlink = generateSlitherlinkPuzzleData({
    width: slitherlinkConfig.size,
    height: slitherlinkConfig.size,
    seed,
  });

  const puzzles = await createPuzzles({
    dailyChallengeId: id,
    data: { flow, hanji, hashi, minesweeper, slitherlink },
  });

  void setCachedPuzzles({ dailyChallengeId: id, puzzles });
  return puzzles;
}
