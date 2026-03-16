import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { Spacing } from '@/constants/token';
import { useStableCallback } from '@/hooks/useStableCallback';

import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  CLUE_LINE_HEIGHT,
  HanjiBoard,
  MAX_CELL_SIZE,
} from './HanjiBoard/HanjiBoard';

type GameViewHanjiBoardProps = {
  puzzle: HanjiPuzzle;
};

export function GameViewHanjiBoard({ puzzle }: GameViewHanjiBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzle.id });
  const { refetch } = useDailyChallengesQuery();

  const { cellSize, rowClueWidth, colClueHeight, boardWidth } = useMemo(() => {
    const maxRowClueLen = Math.max(0, ...puzzle.rowClues.map((r) => r.length));
    const maxColClueLen = Math.max(0, ...puzzle.colClues.map((c) => c.length));
    const rClueW = maxRowClueLen > 0 ? maxRowClueLen * 10 + Spacing.two : 0;
    const cClueH = maxColClueLen > 0 ? maxColClueLen * CLUE_LINE_HEIGHT + Spacing.one : 0;

    const availW = screenWidth - Spacing.four * 2 - rClueW - CELL_GAP;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO - cClueH - CELL_GAP - Spacing.four * 2;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const rawCellSize = Math.min(fromW, fromH, MAX_CELL_SIZE);
    const cSize = Math.max(12, rawCellSize);

    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const totalWidth = rClueW + CELL_GAP + gridWidth;

    return {
      cellSize: cSize,
      rowClueWidth: Math.max(rClueW, 24),
      colClueHeight: Math.max(cClueH, 20),
      boardWidth: totalWidth,
    };
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height, puzzle.rowClues, puzzle.colClues]);

  const onSolve = useStableCallback(
    async ({
      durationMs,
      completedAt,
      startedAt,
      hanjiSolution,
    }: {
      durationMs: number;
      completedAt: Date;
      startedAt: Date;
      hanjiSolution: number[][];
    }) => {
      updateOptimisticallyPuzzleAttempt({
        startedAt,
        completedAt,
        durationMs,
      });

      await solvePuzzle({
        puzzleId: puzzle.id,
        puzzleType: PuzzleType.Hanji,
        startedAt,
        completedAt,
        durationMs,
        hanjiSolution,
      }).then(refetch);
    },
  );

  return (
    <HanjiBoard
      puzzle={puzzle}
      cellSize={cellSize}
      rowClueWidth={rowClueWidth}
      colClueHeight={colClueHeight}
      boardWidth={boardWidth}
      onSolve={onSolve}
    />
  );
}
