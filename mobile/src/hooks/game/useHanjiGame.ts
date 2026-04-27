import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { type HanjiCellState, isPuzzleComplete } from '@/utils/hanji/lineValidation';
import { triggerHapticHard, triggerHapticLight, triggerHapticMedium } from '@/utils/hapticUtils';

import { useStateTracker } from './useStateTracker';

type HanjiCells = HanjiCellState[][];

type GameState = {
  cells: HanjiCells;
  hintedCells: string[];
};

type GameAction =
  | { type: 'SET_CELL'; row: number; col: number; state: HanjiCellState }
  | { type: 'APPLY_HINT'; row: number; col: number; state: HanjiCellState }
  | { type: 'REPLACE'; state: GameState }
  | { type: 'RESET'; width: number; height: number };

function createInitialCells(width: number, height: number): HanjiCells {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, (): HanjiCellState => 'empty'),
  );
}

function createInitialState(width: number, height: number): GameState {
  return { cells: createInitialCells(width, height), hintedCells: [] };
}

function setCellAt(cells: HanjiCells, row: number, col: number, value: HanjiCellState): HanjiCells {
  return cells.map((r, ri) => (ri === row ? r.map((c, ci) => (ci === col ? value : c)) : r));
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CELL': {
      const { row, col, state: next } = action;
      return { ...state, cells: setCellAt(state.cells, row, col, next) };
    }
    case 'APPLY_HINT': {
      const { row, col, state: next } = action;
      const key = `${row},${col}`;
      const cells = setCellAt(state.cells, row, col, next);
      const hintedCells = state.hintedCells.includes(key)
        ? state.hintedCells
        : [...state.hintedCells, key];
      return { cells, hintedCells };
    }
    case 'REPLACE':
      return action.state;
    case 'RESET':
      return createInitialState(action.width, action.height);
    default:
      return state;
  }
}

function cloneState(state: GameState): GameState {
  return {
    cells: state.cells.map((row) => [...row]),
    hintedCells: [...state.hintedCells],
  };
}

function areStatesEqual(a: GameState, b: GameState): boolean {
  if (a.cells.length !== b.cells.length) return false;
  if (a.hintedCells.length !== b.hintedCells.length) return false;
  const cellsEqual = a.cells.every((row, rowIdx) =>
    row.every((cell, colIdx) => cell === b.cells[rowIdx]?.[colIdx]),
  );
  if (!cellsEqual) return false;
  return a.hintedCells.every((key, idx) => key === b.hintedCells[idx]);
}

const CYCLE: Record<HanjiCellState, HanjiCellState> = {
  empty: 'filled',
  filled: 'marked',
  marked: 'empty',
};

export type HanjiGame = {
  cells: HanjiCells;
  isHinted: (row: number, col: number) => boolean;
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
  cells: HanjiCells;
  hintedCells?: string[];
  elapsedMs: number;
};

function cellsToHanjiSolution(cells: HanjiCells): number[][] {
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
  const { getElapsedMs, getSolveTiming, replaceAccumulatedMs } = usePlaytimeClockContext();
  const { width, height, rowClues, colClues, id: puzzleId } = puzzle;
  const { isEmpty, pushStateSnapshot, popStateSnapshot, clearSnapshots } =
    useStateTracker<GameState>();

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
        hintedCells: z.array(z.string()).optional(),
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

  const [state, dispatch] = useReducer(
    gameReducer,
    { width, height, persisted: persistedState },
    ({ width: w, height: h, persisted }) =>
      persisted == null
        ? createInitialState(w, h)
        : { cells: persisted.cells, hintedCells: persisted.hintedCells ?? [] },
  );
  const submittedRef = useRef(false);
  const hydratedPuzzleIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (hydratedPuzzleIdRef.current === puzzleId) return;
    hydratedPuzzleIdRef.current = puzzleId;
    if (persistedState != null) {
      replaceAccumulatedMs(persistedState.elapsedMs);
    }
  }, [persistedState, puzzleId, replaceAccumulatedMs]);

  const isComplete = useMemo(
    () => isPuzzleComplete(state.cells, rowClues, colClues, width, height),
    [state.cells, rowClues, colClues, width, height],
  );

  const saveWithTime = (next: GameState) => {
    saveState({
      cells: next.cells,
      hintedCells: next.hintedCells,
      elapsedMs: getElapsedMs(),
    });
  };

  const isHinted = useCallback(
    (row: number, col: number): boolean => state.hintedCells.includes(`${row},${col}`),
    [state.hintedCells],
  );

  // Trigger endgame when the puzzle is completed
  useEffect(() => {
    if (!isComplete || submittedRef.current) return;
    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const { durationMs, startedAt } = getSolveTiming(completedAt);

    stableOnSolve({
      hanjiSolution: cellsToHanjiSolution(state.cells),
      durationMs,
      completedAt,
      startedAt,
    })
      .catch(() => {
        submittedRef.current = false;
      })
      .finally(() => {
        clearState();
      });
  }, [state.cells, clearState, getSolveTiming, isComplete, stableOnSolve]);

  const onCellTap = useStableCallback((row: number, col: number) => {
    if (isHinted(row, col)) return;
    const current = state.cells[row][col];
    triggerHapticLight();
    const next = gameReducer(state, { type: 'SET_CELL', row, col, state: CYCLE[current] });
    pushStateSnapshot(cloneState(state));
    saveWithTime(next);
    dispatch({ type: 'SET_CELL', row, col, state: CYCLE[current] });
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    if (isHinted(row, col)) return;
    const current = state.cells[row][col];
    const next: HanjiCellState =
      current === 'empty' ? 'marked' : current === 'marked' ? 'empty' : current;
    if (next !== current) {
      triggerHapticMedium();
      const nextState = gameReducer(state, { type: 'SET_CELL', row, col, state: next });
      pushStateSnapshot(cloneState(state));
      saveWithTime(nextState);
      dispatch({ type: 'SET_CELL', row, col, state: next });
    }
  });

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Hanji }>) => {
      const { row, col, value } = hint;
      const desired: HanjiCellState = value === 1 ? 'filled' : 'empty';
      const current = state.cells[row]?.[col];
      if (current == null) return;

      if (current !== desired) {
        triggerHapticMedium();
      }
      const nextState = gameReducer(state, { type: 'APPLY_HINT', row, col, state: desired });
      clearSnapshots();
      saveWithTime(nextState);
      dispatch({ type: 'APPLY_HINT', row, col, state: desired });
    },
  );

  const onUndoPress = useStableCallback(() => {
    const previous = popStateSnapshot();
    if (previous == null) return;
    saveWithTime(previous);
    dispatch({ type: 'REPLACE', state: previous });
  });

  const onClearPress = useStableCallback(() => {
    const nextState = gameReducer(state, { type: 'RESET', width, height });
    if (areStatesEqual(state, nextState)) return;
    pushStateSnapshot(cloneState(state));
    saveWithTime(nextState);
    dispatch({ type: 'RESET', width, height });
  });

  const currentState = useMemo(() => cellsToHanjiSolution(state.cells), [state.cells]);

  return {
    cells: state.cells,
    isHinted,
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
