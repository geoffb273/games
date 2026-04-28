import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { useUserStreakQuery } from '@/api/user/userStreakQuery';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  MAX_CELL_SIZE,
  SlitherlinkBoard,
} from '@/components/game/SlitherlinkBoard/SlitherlinkBoard';
import { Spacing } from '@/constants/token';
import { type SlitherlinkOnSolveInput } from '@/hooks/game/useSlitherlinkGame';
import { useStableCallback } from '@/hooks/useStableCallback';

type GameViewSlitherlinkBoardProps = {
  puzzle: SlitherlinkPuzzle;
  onAnimationComplete: () => void;
};

export function GameViewSlitherlinkBoard({
  puzzle,
  onAnimationComplete,
}: GameViewSlitherlinkBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzle.id });
  const { optimisticallyUpdateDailyChallenge } = useDailyChallengesQuery({ cacheOnly: true });
  const { refetch } = useUserStreakQuery({ cacheOnly: true });

  const cellSize = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    return Math.min(fromW, fromH, MAX_CELL_SIZE);
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

  const onSolve = useStableCallback(
    async ({
      durationMs,
      completedAt,
      startedAt,
      slitherlinkSolution,
    }: SlitherlinkOnSolveInput) => {
      updateOptimisticallyPuzzleAttempt({ startedAt, completedAt, durationMs });
      const updatedDailyChallenge = optimisticallyUpdateDailyChallenge({
        id: puzzle.dailyChallenge.id,
        update: (prev) => ({ ...prev, completedPuzzleCount: prev.completedPuzzleCount + 1 }),
      });

      try {
        await solvePuzzle({
          puzzleId: puzzle.id,
          puzzleType: PuzzleType.Slitherlink,
          startedAt,
          completedAt,
          durationMs,
          slitherlinkSolution,
        });
      } catch (error) {
        if (updatedDailyChallenge != null) {
          optimisticallyUpdateDailyChallenge({
            id: puzzle.dailyChallenge.id,
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
    },
  );

  return (
    <SlitherlinkBoard
      puzzle={puzzle}
      cellSize={cellSize}
      onSolve={onSolve}
      onAnimationComplete={onAnimationComplete}
    />
  );
}
