import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';

import { z } from 'zod';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleHint } from '@/api/puzzle/puzzleHint';
import { usePlaytimeClockContext } from '@/context/PlaytimeClockContext';
import { usePersistedGameState } from '@/hooks/game/usePersistedGameState';
import { useStableCallback } from '@/hooks/useStableCallback';
import { triggerHapticHard, triggerHapticLight } from '@/utils/hapticUtils';
import { getCellsToReveal } from '@/utils/minesweeper/reveal';

// --- Game State ---

type CellStatus = 'hidden' | 'flagged';

export type InteractionMode = 'flag' | 'reveal';

type GameState = {
  cells: CellStatus[][];
  flagCount: number;
  userRevealedCells: { row: number; col: number; value: number }[];
  gameOver: boolean;
  hintedCells: string[];
};

type GameAction =
  | { type: 'TOGGLE_FLAG'; row: number; col: number }
  | { type: 'REVEAL_CELLS'; cells: { row: number; col: number; value: number }[] }
  | { type: 'APPLY_FLAG_HINT'; row: number; col: number }
  | { type: 'GAME_OVER' };

function createInitialState({ height, width }: { height: number; width: number }): GameState {
  return {
    cells: Array.from({ length: height }, () =>
      Array.from({ length: width }, (): CellStatus => 'hidden'),
    ),
    flagCount: 0,
    userRevealedCells: [],
    gameOver: false,
    hintedCells: [],
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TOGGLE_FLAG': {
      const { row, col } = action;
      const current = state.cells[row][col];
      const next: CellStatus = current === 'flagged' ? 'hidden' : 'flagged';
      return {
        ...state,
        cells: state.cells.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? next : c)) : r,
        ),
        flagCount: state.flagCount + (next === 'flagged' ? 1 : -1),
      };
    }
    case 'REVEAL_CELLS': {
      const existingKeys = new Set(state.userRevealedCells.map((c) => `${c.row},${c.col}`));
      const merged = [...state.userRevealedCells];
      for (const c of action.cells) {
        const k = `${c.row},${c.col}`;
        if (existingKeys.has(k)) continue;
        existingKeys.add(k);
        merged.push(c);
      }
      return { ...state, userRevealedCells: merged };
    }
    case 'APPLY_FLAG_HINT': {
      const { row, col } = action;
      const key = `${row},${col}`;
      const current = state.cells[row][col];
      const isAlreadyFlagged = current === 'flagged';
      const cells = isAlreadyFlagged
        ? state.cells
        : state.cells.map((r, ri) =>
            ri === row ? r.map((c, ci) => (ci === col ? 'flagged' : c)) : r,
          );
      const flagCount = isAlreadyFlagged ? state.flagCount : state.flagCount + 1;
      const hintedCells = state.hintedCells.includes(key)
        ? state.hintedCells
        : [...state.hintedCells, key];
      return { ...state, cells, flagCount, hintedCells };
    }
    case 'GAME_OVER':
      return { ...state, gameOver: true };
    default:
      return state;
  }
}

export type MinesweeperGame = {
  revealedMap: Map<string, number>;
  isHinted: (row: number, col: number) => boolean;
  cells: CellStatus[][];
  remaining: number;
  triggeredMineCell: { row: number; col: number } | null;
  mode: InteractionMode;
  onCellTap: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
  toggleMode: () => void;
  onHint: (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Minesweeper }>) => void;
  currentState: boolean[][];
  isWin: boolean;
  isLoss: boolean;
};

type PersistedGameState = Omit<GameState, 'hintedCells'> & {
  hintedCells?: string[];
};

type MinesweeperPersisted = {
  state: PersistedGameState;
  mode: InteractionMode;
  elapsedMs: number;
};

export function buildMinesweeperSolution(mineField: (number | 'MINE')[][]): boolean[][] {
  return mineField.map((row) => row.map((cell) => cell === 'MINE'));
}

export type MinesweeperOnSolveInput = {
  minesweeperSolution: boolean[][];
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  success: boolean;
};

function buildMinesweeperCurrentState(cells: CellStatus[][]): boolean[][] {
  return cells.map((row) => row.map((cell) => cell === 'flagged'));
}

const cellStatusSchema = z.union([z.literal('hidden'), z.literal('flagged')]);
const revealedCellSchema = z.object({
  row: z.number().int().nonnegative(),
  col: z.number().int().nonnegative(),
  value: z.number().int(),
});

export function useMinesweeperGame({
  puzzle,
  onSolve,
}: {
  puzzle: MinesweeperPuzzle;
  onSolve: (input: MinesweeperOnSolveInput) => Promise<void>;
}): MinesweeperGame {
  const stableOnSolve = useStableCallback(onSolve);
  const { getElapsedMs, getSolveTiming, replaceAccumulatedMs } = usePlaytimeClockContext();
  const { id: puzzleId, width, height, mineCount, mineField } = puzzle;

  const stateSchema = useMemo(
    () =>
      z.object({
        cells: z
          .array(z.array(cellStatusSchema))
          .refine(
            (rows) => rows.length === height && rows.every((r) => r.length === width),
            'Invalid minesweeper cells dimensions',
          ),
        flagCount: z.number().int().min(0),
        userRevealedCells: z.array(revealedCellSchema),
        gameOver: z.boolean(),
        hintedCells: z.array(z.string()).optional(),
      }),
    [height, width],
  );

  const persistedSchema = useMemo(
    () =>
      z.object({
        state: stateSchema,
        mode: z.union([z.literal('flag'), z.literal('reveal')]),
        elapsedMs: z.number().nonnegative(),
      }),
    [stateSchema],
  );

  const { persistedState, saveState, clearState } = usePersistedGameState<MinesweeperPersisted>({
    puzzleId,
    puzzleType: PuzzleType.Minesweeper,
    version: 1,
    schema: persistedSchema,
  });

  const [state, dispatch] = useReducer(
    gameReducer,
    persistedState?.state ?? { height, width },
    (initial) =>
      'cells' in initial
        ? { ...initial, hintedCells: initial.hintedCells ?? [] }
        : createInitialState(initial),
  );
  const [triggeredMineCell, setTriggeredMineCell] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [mode, setMode] = useState<InteractionMode>(persistedState?.mode ?? 'flag');
  const submittedRef = useRef(false);
  const hydratedPuzzleIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (hydratedPuzzleIdRef.current === puzzleId) return;
    hydratedPuzzleIdRef.current = puzzleId;
    if (persistedState != null) {
      replaceAccumulatedMs(persistedState.elapsedMs);
    }
  }, [persistedState, puzzleId, replaceAccumulatedMs]);

  const revealedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { row, col, value } of puzzle.revealedCells) {
      map.set(`${row},${col}`, value);
    }
    for (const { row, col, value } of state.userRevealedCells) {
      map.set(`${row},${col}`, value);
    }
    return map;
  }, [puzzle.revealedCells, state.userRevealedCells]);
  const isHinted = useCallback(
    (row: number, col: number): boolean => state.hintedCells.includes(`${row},${col}`),
    [state.hintedCells],
  );

  const remaining = puzzle.mineCount - state.flagCount;

  const isWin = !state.gameOver && revealedMap.size === width * height - mineCount;

  const saveWithTime = useStableCallback((nextState: GameState, nextMode: InteractionMode) => {
    saveState({ state: nextState, mode: nextMode, elapsedMs: getElapsedMs() });
  });

  // Submit the puzzle when the game is over or won
  useEffect(() => {
    if (!state.gameOver && !isWin) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    triggerHapticHard();
    const completedAt = new Date();
    const { durationMs, startedAt } = getSolveTiming(completedAt);
    const success = isWin;

    stableOnSolve({
      minesweeperSolution: buildMinesweeperSolution(mineField),
      startedAt,
      completedAt: success ? completedAt : undefined,
      durationMs: success ? durationMs : undefined,
      success,
    })
      .catch(() => {
        submittedRef.current = false;
      })
      .finally(() => {
        clearState();
      });
  }, [clearState, getSolveTiming, isWin, mineField, state.gameOver, stableOnSolve]);

  const onRevealTap = useStableCallback(({ row, col }: { row: number; col: number }) => {
    const result = getCellsToReveal(row, col, puzzle.mineField, puzzle.width, puzzle.height);
    if (result.hitMine) {
      setTriggeredMineCell({ row, col });
      const next = gameReducer(state, { type: 'GAME_OVER' });
      saveWithTime(next, mode);
      dispatch({ type: 'GAME_OVER' });
    } else {
      triggerHapticLight();
      const next = gameReducer(state, { type: 'REVEAL_CELLS', cells: result.cells });
      saveWithTime(next, mode);
      dispatch({ type: 'REVEAL_CELLS', cells: result.cells });
    }
  });

  const onFlagTap = useStableCallback(
    ({ row, col, isHint }: { row: number; col: number; isHint: boolean }) => {
      if (state.gameOver) return;
      triggerHapticLight();
      const next = gameReducer(state, {
        type: isHint ? 'APPLY_FLAG_HINT' : 'TOGGLE_FLAG',
        row,
        col,
      });
      saveWithTime(next, mode);
      dispatch({ type: isHint ? 'APPLY_FLAG_HINT' : 'TOGGLE_FLAG', row, col });
    },
  );

  const onCellTap = useStableCallback((row: number, col: number) => {
    if (state.gameOver) return;
    const key = `${row},${col}`;
    if (revealedMap.has(key)) return;
    if (state.hintedCells.includes(key)) return;
    const isFlagged = state.cells[row][col] === 'flagged';
    if (mode === 'flag') {
      onFlagTap({ row, col, isHint: false });
    } else if (!isFlagged) {
      onRevealTap({ row, col });
    }
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    if (state.gameOver) return;
    const key = `${row},${col}`;
    if (revealedMap.has(key)) return;
    if (state.hintedCells.includes(key)) return;
    onFlagTap({ row, col, isHint: false });
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'flag' ? 'reveal' : 'flag';
      saveWithTime(state, next);
      return next;
    });
  }, [saveWithTime, state]);

  const onHint = useStableCallback(
    (hint: Extract<PuzzleHint, { puzzleType: PuzzleType.Minesweeper }>) => {
      if (state.gameOver) return;
      const { row, col, isMine } = hint;

      const key = `${row},${col}`;
      if (revealedMap.has(key)) return;
      if (state.hintedCells.includes(key)) return;
      if (isMine) {
        onFlagTap({ row, col, isHint: true });
      } else {
        onRevealTap({ row, col });
      }
    },
  );

  const currentState = useMemo(() => buildMinesweeperCurrentState(state.cells), [state.cells]);

  return {
    revealedMap,
    isHinted,
    cells: state.cells,
    remaining,
    triggeredMineCell,
    mode,
    onCellTap,
    onCellLongPress,
    toggleMode,
    onHint,
    currentState,
    isWin,
    isLoss: state.gameOver && !isWin,
  };
}
