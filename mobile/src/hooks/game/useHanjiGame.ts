import { useEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { type HanjiCellState, isPuzzleComplete } from '@/utils/hanji/lineValidation';
import { triggerHapticHard, triggerHapticLight, triggerHapticMedium } from '@/utils/hapticUtils';

type GameState = HanjiCellState[][];

type GameAction =
  | { type: 'SET_CELL'; row: number; col: number; state: HanjiCellState }
  | { type: 'RESET'; width: number; height: number };

function createInitialState(width: number, height: number): GameState {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, (): HanjiCellState => 'empty'),
  );
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CELL': {
      const { row, col, state: next } = action;
      return state.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? next : c)) : r));
    }
    case 'RESET':
      return createInitialState(action.width, action.height);
    default:
      return state;
  }
}

const CYCLE: Record<HanjiCellState, HanjiCellState> = {
  empty: 'filled',
  filled: 'marked',
  marked: 'empty',
};

export type HanjiGame = {
  cells: GameState;
  isComplete: boolean;
  onCellTap: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
};

type HanjiPersisted = {
  cells: GameState;
  elapsedMs: number;
};

function cellsToHanjiSolution(cells: GameState): number[][] {
  return cells.map((row) => row.map((c) => (c === 'filled' ? 1 : 0)));
}

export function useHanjiGame(puzzle: HanjiPuzzle): HanjiGame {
  const { width, height, rowClues, colClues, id: puzzleId } = puzzle;

  const cellSchema = z.union([z.literal('empty'), z.literal('filled'), z.literal('marked')]);
  const cellsSchema = useMemo(
    () =>
      z
        .array(z.array(cellSchema))
        .refine((rows) => rows.length === height && rows.every((r) => r.length === width), {
          message: 'Invalid Hanji grid dimensions',
        }),
    [cellSchema, height, width],
  );

  const persistedSchema = useMemo(
    () =>
      z.object({
        cells: cellsSchema,
        elapsedMs: z.number().nonnegative(),
      }),
    [cellsSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<HanjiPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Hanji,
    version: 1,
    schema: persistedSchema,
  });

  const [cells, dispatch] = useReducer(
    gameReducer,
    { width, height, persisted: persistedState?.cells },
    ({ width: w, height: h, persisted }) => persisted ?? createInitialState(w, h),
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
    () => isPuzzleComplete(cells, rowClues, colClues, width, height),
    [cells, rowClues, colClues, width, height],
  );

  const saveWithTime = (next: GameState) => {
    const elapsedMs = Date.now() - startedAtRef.current.getTime();
    saveState({ cells: next, elapsedMs });
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
      puzzleType: PuzzleType.Hanji,
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
      hanjiSolution: cellsToHanjiSolution(cells),
    })
      .then(refetch)
      .catch(() => {
        submittedRef.current = false;
      });
  }, [
    cells,
    clearState,
    isComplete,
    puzzleId,
    refetch,
    solvePuzzle,
    updateOptimisticallyPuzzleAttempt,
  ]);

  const onCellTap = useStableCallback((row: number, col: number) => {
    const current = cells[row][col];
    triggerHapticLight();
    const nextState = gameReducer(cells, { type: 'SET_CELL', row, col, state: CYCLE[current] });
    saveWithTime(nextState);
    dispatch({ type: 'SET_CELL', row, col, state: CYCLE[current] });
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    const current = cells[row][col];
    const next: HanjiCellState =
      current === 'empty' ? 'marked' : current === 'marked' ? 'empty' : current;
    if (next !== current) {
      triggerHapticMedium();
      const nextState = gameReducer(cells, { type: 'SET_CELL', row, col, state: next });
      saveWithTime(nextState);
      dispatch({ type: 'SET_CELL', row, col, state: next });
    }
  });

  return {
    cells,
    isComplete,
    onCellTap,
    onCellLongPress,
  };
}
