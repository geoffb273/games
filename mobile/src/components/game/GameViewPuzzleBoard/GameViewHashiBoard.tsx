import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { useUserStreakQuery } from '@/api/user/userStreakQuery';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  HashiBoard,
  MAX_CELL_SIZE,
} from '@/components/game/HashiBoard/HashiBoard';
import { Spacing } from '@/constants/token';
import { type HashiOnSolve } from '@/hooks/game/useHashiGame';
import { useStableCallback } from '@/hooks/useStableCallback';
import { setPuzzleCompletionData } from '@/store/puzzleCompletionStore';

type GameViewHashiBoardProps = {
  puzzle: HashiPuzzle;
  onAnimationComplete: () => void;
};

export function GameViewHashiBoard({ puzzle, onAnimationComplete }: GameViewHashiBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzle.id });
  const { optimisticallyUpdateDailyChallenge } = useDailyChallengesQuery({ cacheOnly: true });
  const { refetch } = useUserStreakQuery({ cacheOnly: true });

  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2 - CELL_GAP;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO - CELL_GAP - Spacing.four * 2;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const rawCellSize = Math.min(fromW, fromH, MAX_CELL_SIZE);
    const cSize = Math.max(20, rawCellSize);

    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const gridHeight = puzzle.height * cSize + CELL_GAP * (puzzle.height - 1);

    return {
      cellSize: cSize,
      boardWidth: gridWidth,
      boardHeight: gridHeight,
    };
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

  const onSolve = useStableCallback(async (params: Parameters<HashiOnSolve>[0]) => {
    const { durationMs, completedAt, startedAt, hashiSolution } = params;
    setPuzzleCompletionData(puzzle.id, {
      type: PuzzleType.Hashi,
      bridges: hashiSolution,
    });
    updateOptimisticallyPuzzleAttempt({
      startedAt,
      completedAt,
      durationMs,
    });

    const updatedDailyChallenge = optimisticallyUpdateDailyChallenge({
      id: puzzle.dailyChallengeId,
      update: (prev) => ({ ...prev, completedPuzzleCount: prev.completedPuzzleCount + 1 }),
    });

    try {
      await solvePuzzle({
        puzzleId: puzzle.id,
        puzzleType: PuzzleType.Hashi,
        startedAt,
        completedAt,
        durationMs,
        hashiSolution,
      });
    } catch (error) {
      if (updatedDailyChallenge != null) {
        optimisticallyUpdateDailyChallenge({
          id: puzzle.dailyChallengeId,
          update: (prev) => ({ ...prev, completedPuzzleCount: prev.completedPuzzleCount - 1 }),
        });
      }
      throw error;
    }

    if (updatedDailyChallenge != null) {
      const { completedPuzzleCount } = updatedDailyChallenge;
      if (completedPuzzleCount === 1) {
        void refetch();
      }
    }
  });

  return (
    <HashiBoard
      puzzle={puzzle}
      cellSize={cellSize}
      boardWidth={boardWidth}
      boardHeight={boardHeight}
      onSolve={onSolve}
      onAnimationComplete={onAnimationComplete}
    />
  );
}
