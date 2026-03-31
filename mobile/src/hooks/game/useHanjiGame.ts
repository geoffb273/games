import { useEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { type HanjiCellState, isPuzzleComplete } from '@/utils/hanji/lineValidation';
import { triggerHapticHard, triggerHapticLight, triggerHapticMedium } from '@/utils/hapticUtils';

import { useStateTracker } from './useStateTracker';

type GameState = HanjiCellState[][];

type GameAction =
  | { type: 'SET_CELL'; row: number; col: number; state: HanjiCellState }
  | { type: 'REPLACE'; cells: GameState }
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
    case 'REPLACE':
      return action.cells;
    case 'RESET':
      return createInitialState(action.width, action.height);
    default:
      return state;
  }
}

function cloneCells(cells: GameState): GameState {
  return cells.map((row) => [...row]);
}

function areCellsEqual(a: GameState, b: GameState): boolean {
  if (a.length !== b.length) return false;
  return a.every((row, rowIdx) => row.every((cell, colIdx) => cell === b[rowIdx]?.[colIdx]));
}

const CYCLE: Record<HanjiCellState, HanjiCellState> = {
  empty: 'filled',
  filled: 'marked',
  marked: 'empty',
};

export type HanjiGame = {
  cells: GameState;
  isComplete: boolean;
  isUndoEnabled: boolean;
  onCellTap: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
  onUndoPress: () => void;
  onClearPress: () => void;
  onHint: (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }>) => void;
  currentState: number[][];
};

type HanjiPersisted = {
  cells: GameState;
  elapsedMs: number;
};

function cellsToHanjiSolution(cells: GameState): number[][] {
  return cells.map((row) => row.map((c) => (c === 'filled' ? 1 : 0)));
}

export type HanjiOnSolve = (params: {
  hanjiSolution: number[][];
  durationMs: number;
  completedAt: Date;
  startedAt: Date;
}) => Promise<void>;

export function useHanjiGame({
  puzzle,
  onSolve,
}: {
  puzzle: HanjiPuzzle;
  onSolve: HanjiOnSolve;
}): HanjiGame {
  const stableOnSolve = useStableCallback(onSolve);
  const { width, height, rowClues, colClues, id: puzzleId } = puzzle;
  const { isEmpty, pushStateSnapshot, popStateSnapshot } = useStateTracker<GameState>();

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

  // Trigger endgame when the puzzle is completed
  useEffect(() => {
    if (!isComplete || submittedRef.current) return;
    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAtRef.current.getTime();

    stableOnSolve({
      hanjiSolution: cellsToHanjiSolution(cells),
      durationMs,
      completedAt,
      startedAt: startedAtRef.current,
    })
      .catch(() => {
        submittedRef.current = false;
      })
      .finally(() => {
        clearState();
      });
  }, [cells, clearState, isComplete, stableOnSolve]);

  const onCellTap = useStableCallback((row: number, col: number) => {
    const current = cells[row][col];
    triggerHapticLight();
    const nextState = gameReducer(cells, { type: 'SET_CELL', row, col, state: CYCLE[current] });
    pushStateSnapshot(cloneCells(cells));
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
      pushStateSnapshot(cloneCells(cells));
      saveWithTime(nextState);
      dispatch({ type: 'SET_CELL', row, col, state: next });
    }
  });

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }>) => {
      const { row, col, value } = hint;
      const desired: HanjiCellState = value === 1 ? 'filled' : 'empty';
      const current = cells[row]?.[col];
      if (current == null || current === desired) return;

      triggerHapticMedium();
      const nextState = gameReducer(cells, { type: 'SET_CELL', row, col, state: desired });
      pushStateSnapshot(cloneCells(cells));
      saveWithTime(nextState);
      dispatch({ type: 'SET_CELL', row, col, state: desired });
    },
  );

  const onUndoPress = useStableCallback(() => {
    const previous = popStateSnapshot();
    if (previous == null) return;
    saveWithTime(previous);
    dispatch({ type: 'REPLACE', cells: previous });
  });

  const onClearPress = useStableCallback(() => {
    const nextState = gameReducer(cells, { type: 'RESET', width, height });
    if (areCellsEqual(cells, nextState)) return;
    pushStateSnapshot(cloneCells(cells));
    saveWithTime(nextState);
    dispatch({ type: 'RESET', width, height });
  });

  const currentState = useMemo(() => cellsToHanjiSolution(cells), [cells]);

  return {
    cells,
    isComplete,
    isUndoEnabled: !isEmpty,
    onCellTap,
    onCellLongPress,
    onUndoPress,
    onClearPress,
    onHint,
    currentState,
  };
}
