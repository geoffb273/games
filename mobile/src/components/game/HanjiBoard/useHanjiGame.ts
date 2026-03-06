import { useEffect, useMemo, useReducer, useRef } from 'react';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { useSolvePuzzle } from '@/api/puzzle/solvePuzzleMutation';
import { useStableCallback } from '@/hooks/useStableCallback';
import { type HanjiCellState, isPuzzleComplete } from '@/utils/hanji/lineValidation';

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

function cellsToHanjiSolution(cells: GameState): number[][] {
  return cells.map((row) => row.map((c) => (c === 'filled' ? 1 : 0)));
}

export function useHanjiGame(puzzle: HanjiPuzzle): HanjiGame {
  const { width, height, rowClues, colClues, id: puzzleId } = puzzle;
  const [cells, dispatch] = useReducer(gameReducer, { width, height }, ({ width: w, height: h }) =>
    createInitialState(w, h),
  );
  const { solvePuzzle } = useSolvePuzzle();
  const startedAtRef = useRef<Date>(puzzle.attempt?.startedAt ?? new Date());
  const submittedRef = useRef(false);

  const isComplete = useMemo(
    () => isPuzzleComplete(cells, rowClues, colClues, width, height),
    [cells, rowClues, colClues, width, height],
  );

  useEffect(() => {
    if (!isComplete || submittedRef.current) return;
    submittedRef.current = true;
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAtRef.current.getTime();
    solvePuzzle({
      puzzleId,
      puzzleType: PuzzleType.Hanji,
      startedAt: startedAtRef.current,
      completedAt,
      durationMs,
      hanjiSolution: cellsToHanjiSolution(cells),
    }).catch(() => {
      submittedRef.current = false;
    });
  }, [isComplete, cells, puzzleId, solvePuzzle]);

  const onCellTap = useStableCallback((row: number, col: number) => {
    const current = cells[row][col];
    dispatch({ type: 'SET_CELL', row, col, state: CYCLE[current] });
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    const current = cells[row][col];
    const next: HanjiCellState =
      current === 'empty' ? 'marked' : current === 'marked' ? 'empty' : current;
    if (next !== current) {
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
