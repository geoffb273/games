import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { Spacing } from '@/constants/token';
import { type MinesweeperOnSolveInput } from '@/hooks/game/useMinesweeperGame';
import { useStableCallback } from '@/hooks/useStableCallback';

import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  MAX_CELL_SIZE,
  MinesweeperBoard,
} from './MinesweeperBoard/MinesweeperBoard';

type GameViewMinesweeperBoardProps = {
  puzzle: MinesweeperPuzzle;
  onAnimationComplete: () => void;
};

export function GameViewMinesweeperBoard({
  puzzle,
  onAnimationComplete,
}: GameViewMinesweeperBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzle.id });
  const { refetch } = useDailyChallengesQuery();

  const cellSize = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    return Math.min(fromW, fromH, MAX_CELL_SIZE);
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

  const onSolve = useStableCallback(
    async ({
      startedAt,
      completedAt,
      durationMs,
      minesweeperSolution,
    }: MinesweeperOnSolveInput) => {
      updateOptimisticallyPuzzleAttempt({
        startedAt,
        ...(completedAt != null && durationMs != null && { completedAt, durationMs }),
      });

      const attempt = await solvePuzzle({
        puzzleId: puzzle.id,
        puzzleType: PuzzleType.Minesweeper,
        startedAt,
        ...(completedAt != null && durationMs != null && { completedAt, durationMs }),
        minesweeperSolution,
      });
      updateOptimisticallyPuzzleAttempt({
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        durationMs: attempt.durationMs,
        percentage: attempt.percentage,
      });
      await refetch();
    },
  );

  return (
    <MinesweeperBoard
      puzzle={puzzle}
      cellSize={cellSize}
      onSolve={onSolve}
      onAnimationComplete={onAnimationComplete}
    />
  );
}
