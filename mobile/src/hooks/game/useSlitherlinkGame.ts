import { useEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
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
    }
  | {
      type: 'SET_EDGE';
      orientation: EdgeOrientation;
      row: number;
      col: number;
      filled: boolean;
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
    case 'SET_EDGE': {
      const { orientation, row, col, filled } = action;
      const source = orientation === 'horizontal' ? state.horizontal : state.vertical;
      if (source[row]?.[col] == null) {
        return state;
      }
      const nextGrid = source.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? (filled ? EDGE_CYCLE.empty : EDGE_CYCLE.line) : c))
          : r,
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
  onClearPress: () => void;
  onHint: (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Slitherlink }>) => void;
  currentState: {
    horizontalEdges: boolean[][];
    verticalEdges: boolean[][];
  };
};

export type SlitherlinkOnSolveInput = {
  slitherlinkSolution: { horizontalEdges: boolean[][]; verticalEdges: boolean[][] };
  durationMs: number;
  completedAt: Date;
  startedAt: Date;
};

const edgeSchema = z.union([z.literal('empty'), z.literal('line')]);

export function useSlitherlinkGame({
  puzzle,
  onSolve,
}: {
  puzzle: SlitherlinkPuzzle;
  onSolve: (input: SlitherlinkOnSolveInput) => Promise<void>;
}): SlitherlinkGame {
  const stableOnSolve = useStableCallback(onSolve);
  const { id: puzzleId, width, height, clues } = puzzle;

  const horizontalSchema = useMemo(
    () =>
      z
        .array(z.array(edgeSchema))
        .refine(
          (rows) => rows.length === height + 1 && rows.every((r) => r.length === width),
          'Invalid horizontal edges dimensions',
        ),
    [width, height],
  );
  const verticalSchema = useMemo(
    () =>
      z
        .array(z.array(edgeSchema))
        .refine(
          (rows) => rows.length === height && rows.every((r) => r.length === width + 1),
          'Invalid vertical edges dimensions',
        ),
    [width, height],
  );

  const stateSchema = useMemo(
    () =>
      z.object({
        horizontal: horizontalSchema,
        vertical: verticalSchema,
      }),
    [horizontalSchema, verticalSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<GameState>({
    puzzleId,
    puzzleType: PuzzleType.Slitherlink,
    version: 1,
    schema: stateSchema,
  });

  const [state, dispatch] = useReducer(
    gameReducer,
    persistedState ?? { width, height },
    (initial) =>
      'horizontal' in initial
        ? (initial as GameState)
        : createInitialState(
            (initial as { width: number; height: number }).width,
            (initial as { width: number; height: number }).height,
          ),
  );

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

    stableOnSolve({
      slitherlinkSolution: {
        horizontalEdges: horizontalLines,
        verticalEdges: verticalLines,
      },
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
  }, [clearState, horizontalLines, isComplete, stableOnSolve, verticalLines]);

  const onHorizontalEdgePress = useStableCallback((row: number, col: number) => {
    triggerHapticLight();
    const next = gameReducer(state, { type: 'TOGGLE_EDGE', orientation: 'horizontal', row, col });
    saveState(next);
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'horizontal', row, col });
  });

  const onVerticalEdgePress = useStableCallback((row: number, col: number) => {
    triggerHapticLight();
    const next = gameReducer(state, { type: 'TOGGLE_EDGE', orientation: 'vertical', row, col });
    saveState(next);
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'vertical', row, col });
  });

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Slitherlink }>) => {
      if (isComplete) return;

      const { row, col, edgeType, filled } = hint;
      const orientation: EdgeOrientation = edgeType === 'HORIZONTAL' ? 'horizontal' : 'vertical';

      triggerHapticLight();
      const next = gameReducer(state, {
        type: 'SET_EDGE',
        orientation,
        row,
        col,
        filled,
      });
      saveState(next);
      dispatch({ type: 'SET_EDGE', orientation, row, col, filled });
    },
  );

  const onClearPress = useStableCallback(() => {
    const next = gameReducer(state, { type: 'RESET', width, height });
    saveState(next);
    dispatch({ type: 'RESET', width, height });
  });

  const currentState = useMemo(
    () => ({
      horizontalEdges: horizontalLines,
      verticalEdges: verticalLines,
    }),
    [horizontalLines, verticalLines],
  );

  return {
    horizontal: state.horizontal,
    vertical: state.vertical,
    isComplete,
    onHorizontalEdgePress,
    onVerticalEdgePress,
    onClearPress,
    onHint,
    currentState,
  };
}
