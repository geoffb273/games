import { useEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { isFlowComplete } from '@/utils/flow/validation';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';

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

type FlowPersisted = {
  grid: number[][];
  elapsedMs: number;
};

export function useFlowGame(puzzle: FlowPuzzle): FlowGame {
  const { id: puzzleId, width, height, pairs } = puzzle;
  const gridSchema = useMemo(
    () =>
      z
        .array(z.array(z.number()))
        .refine((rows) => rows.length === height && rows.every((r) => r.length === width), {
          message: 'Invalid grid dimensions',
        }),
    [width, height],
  );

  const persistedSchema = useMemo(
    () =>
      z.object({
        grid: gridSchema,
        elapsedMs: z.number().nonnegative(),
      }),
    [gridSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<FlowPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Flow,
    version: 1,
    schema: persistedSchema,
  });

  const [grid, dispatch] = useReducer(
    gridReducer,
    { width, height, persisted: persistedState?.grid },
    ({ width: w, height: h, persisted }) => persisted ?? createInitialGrid(w, h),
  );
  const { solvePuzzle } = useSolvePuzzle();
  const { updateOptimisticallyPuzzleAttempt } = usePuzzleQuery({ id: puzzleId });
  const { refetch } = useDailyChallengesQuery();
  const startedAtRef = useRef<Date>(
    persistedState != null
      ? new Date(Date.now() - persistedState.elapsedMs)
      : (puzzle.attempt?.startedAt ?? new Date()),
  );
  const submittedRef = useRef(false);

  const isComplete = useMemo(
    () => isFlowComplete(width, height, pairs, grid),
    [width, height, pairs, grid],
  );

  const saveWithTime = (nextGrid: number[][]) => {
    const elapsedMs = Date.now() - startedAtRef.current.getTime();
    saveState({ grid: nextGrid, elapsedMs });
  };

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

    clearState();

    solvePuzzle({
      puzzleId,
      puzzleType: PuzzleType.Flow,
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
      flowSolution: grid.map((row) => row.slice()),
    })
      .then(refetch)
      .catch(() => {
        submittedRef.current = false;
      });
  }, [
    clearState,
    isComplete,
    grid,
    puzzleId,
    solvePuzzle,
    updateOptimisticallyPuzzleAttempt,
    refetch,
  ]);

  const setCell = useStableCallback((row: number, col: number, value: number) => {
    triggerHapticLight();
    const nextGrid = gridReducer(grid, { type: 'SET_CELL', row, col, value });
    saveWithTime(nextGrid);
    dispatch({ type: 'SET_CELL', row, col, value });
  });

  const clearPathForPair = useStableCallback((pairNumber: number) => {
    const nextGrid = gridReducer(grid, { type: 'CLEAR_PAIR', pairNumber });
    saveWithTime(nextGrid);
    dispatch({ type: 'CLEAR_PAIR', pairNumber });
  });

  return {
    grid,
    isComplete,
    setCell,
    clearPathForPair,
  };
}
