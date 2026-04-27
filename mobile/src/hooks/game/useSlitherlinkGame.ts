import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from 'react';

import { z } from 'zod';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';
import { isSlitherlinkComplete } from '@/utils/slitherlink/validation';

import { useStateTracker } from './useStateTracker';

type EdgeState = 'empty' | 'line';

type EdgeGridState = EdgeState[][];

type EdgeOrientation = 'horizontal' | 'vertical';

type GameState = {
  horizontal: EdgeGridState;
  vertical: EdgeGridState;
  hintedEdges: string[];
};

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
      type: 'APPLY_HINT';
      orientation: EdgeOrientation;
      row: number;
      col: number;
      filled: boolean;
    }
  | { type: 'REPLACE'; state: GameState };

function createEmptyGrid(rows: number, cols: number): EdgeGridState {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, (): EdgeState => 'empty'));
}

function cloneState(state: GameState): GameState {
  return {
    horizontal: state.horizontal.map((row) => [...row]),
    vertical: state.vertical.map((row) => [...row]),
    hintedEdges: [...state.hintedEdges],
  };
}

function createInitialState(width: number, height: number): GameState {
  return {
    horizontal: createEmptyGrid(height + 1, width),
    vertical: createEmptyGrid(height, width + 1),
    hintedEdges: [],
  };
}

const EDGE_CYCLE: Record<EdgeState, EdgeState> = {
  empty: 'line',
  line: 'empty',
};

function edgeKey(orientation: EdgeOrientation, row: number, col: number): string {
  return `${orientation}|${row},${col}`;
}

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
        ...state,
        horizontal: orientation === 'horizontal' ? nextGrid : state.horizontal,
        vertical: orientation === 'vertical' ? nextGrid : state.vertical,
      };
    }
    case 'APPLY_HINT': {
      const { orientation, row, col, filled } = action;
      const source = orientation === 'horizontal' ? state.horizontal : state.vertical;
      if (source[row]?.[col] == null) {
        return state;
      }
      const target: EdgeState = filled ? 'line' : 'empty';
      const nextGrid = source.map((r, ri) =>
        ri === row ? r.map((c, ci) => (ci === col ? target : c)) : r,
      );
      const key = edgeKey(orientation, row, col);
      const hintedEdges = state.hintedEdges.includes(key)
        ? state.hintedEdges
        : [...state.hintedEdges, key];
      return {
        horizontal: orientation === 'horizontal' ? nextGrid : state.horizontal,
        vertical: orientation === 'vertical' ? nextGrid : state.vertical,
        hintedEdges,
      };
    }
    case 'REPLACE': {
      return action.state;
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
  isHorizontalEdgeHinted: (row: number, col: number) => boolean;
  isVerticalEdgeHinted: (row: number, col: number) => boolean;
  isComplete: boolean;
  onHorizontalEdgePress: (row: number, col: number) => void;
  onVerticalEdgePress: (row: number, col: number) => void;
  onClearPress: () => void;
  onHint: (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Slitherlink }>) => void;
  currentState: {
    horizontalEdges: boolean[][];
    verticalEdges: boolean[][];
  };
  isUndoEnabled: boolean;
  onUndoPress: () => void;
};

export type SlitherlinkOnSolveInput = {
  slitherlinkSolution: { horizontalEdges: boolean[][]; verticalEdges: boolean[][] };
  durationMs: number;
  completedAt: Date;
  startedAt: Date;
};

const edgeSchema = z.union([z.literal('empty'), z.literal('line')]);

type SlitherlinkPersisted = {
  horizontal: EdgeGridState;
  vertical: EdgeGridState;
  hintedEdges?: string[];
  elapsedMs: number;
};

export function useSlitherlinkGame({
  puzzle,
  onSolve,
}: {
  puzzle: SlitherlinkPuzzle;
  onSolve: (input: SlitherlinkOnSolveInput) => Promise<void>;
}): SlitherlinkGame {
  const stableOnSolve = useStableCallback(onSolve);
  const { getElapsedMs, getSolveTiming, replaceAccumulatedMs } = usePlaytimeClockContext();
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

  const persistedSchema = useMemo(
    () =>
      z.object({
        horizontal: horizontalSchema,
        vertical: verticalSchema,
        hintedEdges: z.array(z.string()).optional(),
        elapsedMs: z.number().nonnegative(),
      }),
    [horizontalSchema, verticalSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<SlitherlinkPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Slitherlink,
    version: 2,
    schema: persistedSchema,
  });

  const [state, dispatch] = useReducer(
    gameReducer,
    { width, height, persisted: persistedState },
    ({ width: w, height: h, persisted }) =>
      persisted == null
        ? createInitialState(w, h)
        : {
            horizontal: persisted.horizontal,
            vertical: persisted.vertical,
            hintedEdges: persisted.hintedEdges ?? [],
          },
  );

  const { isEmpty, pushStateSnapshot, popStateSnapshot, clearSnapshots } =
    useStateTracker<GameState>();

  const submittedRef = useRef(false);
  const hydratedPuzzleIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (hydratedPuzzleIdRef.current === puzzleId) return;
    hydratedPuzzleIdRef.current = puzzleId;
    if (persistedState != null) {
      replaceAccumulatedMs(persistedState.elapsedMs);
    }
  }, [persistedState, puzzleId, replaceAccumulatedMs]);

  const saveWithTime = (next: GameState) => {
    saveState({
      horizontal: next.horizontal,
      vertical: next.vertical,
      hintedEdges: next.hintedEdges,
      elapsedMs: getElapsedMs(),
    });
  };

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
    const { durationMs, startedAt } = getSolveTiming(completedAt);

    stableOnSolve({
      slitherlinkSolution: {
        horizontalEdges: horizontalLines,
        verticalEdges: verticalLines,
      },
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
  }, [clearState, getSolveTiming, horizontalLines, isComplete, stableOnSolve, verticalLines]);

  const isHinted = (orientation: EdgeOrientation, row: number, col: number): boolean =>
    state.hintedEdges.includes(edgeKey(orientation, row, col));

  const isHorizontalEdgeHinted = useStableCallback((row: number, col: number): boolean =>
    isHinted('horizontal', row, col),
  );
  const isVerticalEdgeHinted = useStableCallback((row: number, col: number): boolean =>
    isHinted('vertical', row, col),
  );

  const onHorizontalEdgePress = useStableCallback((row: number, col: number) => {
    if (isHinted('horizontal', row, col)) return;
    triggerHapticLight();
    const next = gameReducer(state, { type: 'TOGGLE_EDGE', orientation: 'horizontal', row, col });
    pushStateSnapshot(cloneState(state));
    saveWithTime(next);
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'horizontal', row, col });
  });

  const onVerticalEdgePress = useStableCallback((row: number, col: number) => {
    if (isHinted('vertical', row, col)) return;
    triggerHapticLight();
    const next = gameReducer(state, { type: 'TOGGLE_EDGE', orientation: 'vertical', row, col });
    pushStateSnapshot(cloneState(state));
    saveWithTime(next);
    dispatch({ type: 'TOGGLE_EDGE', orientation: 'vertical', row, col });
  });

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Slitherlink }>) => {
      if (isComplete) return;

      const { row, col, edgeType, filled } = hint;
      const orientation: EdgeOrientation = edgeType === 'HORIZONTAL' ? 'horizontal' : 'vertical';

      triggerHapticLight();
      const next = gameReducer(state, {
        type: 'APPLY_HINT',
        orientation,
        row,
        col,
        filled,
      });
      clearSnapshots();
      saveWithTime(next);
      dispatch({ type: 'APPLY_HINT', orientation, row, col, filled });
    },
  );

  const onClearPress = useStableCallback(() => {
    const next = gameReducer(state, { type: 'RESET', width, height });
    pushStateSnapshot(cloneState(state));
    saveWithTime(next);
    dispatch({ type: 'RESET', width, height });
  });

  const onUndoPress = useStableCallback(() => {
    const previous = popStateSnapshot();
    if (previous == null) return;
    saveWithTime(previous);
    dispatch({ type: 'REPLACE', state: previous });
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
    isHorizontalEdgeHinted,
    isVerticalEdgeHinted,
    isComplete,
    onHorizontalEdgePress,
    onVerticalEdgePress,
    onClearPress,
    onHint,
    currentState,
    isUndoEnabled: !isEmpty,
    onUndoPress,
  };
}
