import { useEffect, useMemo, useReducer, useRef } from 'react';

import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { useStableCallback } from '@/hooks/useStableCallback';
import { isFlowComplete } from '@/utils/flow/validation';

type GameAction =
  | { type: 'SET_CELL'; row: number; col: number; value: number }
  | { type: 'CLEAR_PAIR'; pairNumber: number }
  | { type: 'RESET'; width: number; height: number };

function createInitialGrid(width: number, height: number): number[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0));
}

function gridReducer(state: number[][], action: GameAction): number[][] {
  switch (action.type) {
    case 'SET_CELL': {
      const { row, col, value } = action;
      return state.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r));
    }
    case 'CLEAR_PAIR': {
      const { pairNumber } = action;
      return state.map((row) => row.map((v) => (v === pairNumber ? 0 : v)));
    }
    case 'RESET':
      return createInitialGrid(action.width, action.height);
    default:
      return state;
  }
}

export type FlowGame = {
  grid: number[][];
  isComplete: boolean;
  setCell: (row: number, col: number, value: number) => void;
  clearPathForPair: (pairNumber: number) => void;
};

export function useFlowGame(puzzle: FlowPuzzle): FlowGame {
  const { id: puzzleId, width, height, pairs } = puzzle;
  const [grid, dispatch] = useReducer(gridReducer, { width, height }, ({ width: w, height: h }) =>
    createInitialGrid(w, h),
  );
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzleId });
  const startedAtRef = useRef<Date>(puzzle.attempt?.startedAt ?? new Date());
  const submittedRef = useRef(false);

  const isComplete = useMemo(
    () => isFlowComplete(width, height, pairs, grid),
    [width, height, pairs, grid],
  );

  useEffect(() => {
    if (!isComplete || submittedRef.current) return;

    submittedRef.current = true;
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAtRef.current.getTime();

    updateOptimisticallyPuzzleAttempt({
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
    });

    solvePuzzle({
      puzzleId,
      puzzleType: PuzzleType.Flow,
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
      flowSolution: grid.map((row) => row.slice()),
    }).catch(() => {
      submittedRef.current = false;
    });
  }, [isComplete, grid, puzzleId, solvePuzzle, updateOptimisticallyPuzzleAttempt]);

  const setCell = useStableCallback((row: number, col: number, value: number) => {
    dispatch({ type: 'SET_CELL', row, col, value });
  });

  const clearPathForPair = useStableCallback((pairNumber: number) => {
    dispatch({ type: 'CLEAR_PAIR', pairNumber });
  });

  return {
    grid,
    isComplete,
    setCell,
    clearPathForPair,
  };
}
