import { useEffect, useMemo, useReducer, useRef } from 'react';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { useStableCallback } from '@/hooks/useStableCallback';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';
import { isSlitherlinkComplete } from '@/utils/slitherlink/validation';

type EdgeState = 'empty' | 'line';

type EdgeGridState = EdgeState[][];

type GameState = {
  horizontal: EdgeGridState;
  vertical: EdgeGridState;
};

type EdgeOrientation = 'horizontal' | 'vertical';

type GameAction =
  | {
      type: 'TOGGLE_EDGE';
      orientation: EdgeOrientation;
      row: number;
      col: number;
    }
  | {
      type: 'RESET';
      width: number;
      height: number;
    };

function createEmptyGrid(rows: number, cols: number): EdgeGridState {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, (): EdgeState => 'empty'));
}

function createInitialState(width: number, height: number): GameState {
  return {
    horizontal: createEmptyGrid(height + 1, width),
    vertical: createEmptyGrid(height, width + 1),
  };
}

const EDGE_CYCLE: Record<EdgeState, EdgeState> = {
  empty: 'line',
  line: 'empty',
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TOGGLE_EDGE': {
      const { orientation, row, col } = action;
      const source = orientation === 'horizontal' ? state.horizontal : state.vertical;
      if (source[row]?.[col] == null) {
        return state;
      }
      const nextGrid = source.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? EDGE_CYCLE[c] : c)) : r,
      );
      return {
        horizontal: orientation === 'horizontal' ? nextGrid : state.horizontal,
        vertical: orientation === 'vertical' ? nextGrid : state.vertical,
      };
    }
    case 'RESET':
      return createInitialState(action.width, action.height);
    default:
      return state;
  }
}

function toBooleanGrid(grid: EdgeGridState): boolean[][] {
  return grid.map((row) => row.map((cell) => cell === 'line'));
}

export type SlitherlinkGame = {
  horizontal: EdgeGridState;
  vertical: EdgeGridState;
  isComplete: boolean;
  onHorizontalEdgePress: (row: number, col: number) => void;
  onVerticalEdgePress: (row: number, col: number) => void;
};

export function useSlitherlinkGame(puzzle: SlitherlinkPuzzle): SlitherlinkGame {
  const { id: puzzleId, width, height, clues } = puzzle;
  const [state, dispatch] = useReducer(gameReducer, { width, height }, ({ width: w, height: h }) =>
    createInitialState(w, h),
  );

  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzleId });
  const { refetch } = useDailyChallengesQuery();

  const startedAtRef = useRef<Date>(puzzle.attempt?.startedAt ?? new Date());
  const submittedRef = useRef(false);

  const horizontalLines = useMemo(() => toBooleanGrid(state.horizontal), [state.horizontal]);
  const verticalLines = useMemo(() => toBooleanGrid(state.vertical), [state.vertical]);

  const isComplete = useMemo(
    () => isSlitherlinkComplete(width, height, clues, horizontalLines, verticalLines),
    [width, height, clues, horizontalLines, verticalLines],
  );

  useEffect(() => {
    if (!isComplete || submittedRef.current) return;

    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAtRef.current.getTime();

    updateOptimisticallyPuzzleAttempt({
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
    });

    solvePuzzle({
      puzzleId,
      puzzleType: PuzzleType.Slitherlink,
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
      slitherlinkSolution: {
        horizontalEdges: horizontalLines,
        verticalEdges: verticalLines,
      },
    })
      .then(refetch)
      .catch(() => {
        submittedRef.current = false;
      });
  }, [
    isComplete,
    puzzleId,
    horizontalLines,
    verticalLines,
    solvePuzzle,
    updateOptimisticallyPuzzleAttempt,
    refetch,
  ]);

  const onHorizontalEdgePress = useStableCallback((row: number, col: number) => {
    triggerHapticLight();
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'horizontal', row, col });
  });

  const onVerticalEdgePress = useStableCallback((row: number, col: number) => {
    triggerHapticLight();
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'vertical', row, col });
  });

  return {
    horizontal: state.horizontal,
    vertical: state.vertical,
    isComplete,
    onHorizontalEdgePress,
    onVerticalEdgePress,
  };
}
