import { useCallback, useMemo, useReducer, useState } from 'react';

import { type MinesweeperPuzzle } from '@/api/puzzle/puzzle';
import { useStableCallback } from '@/hooks/useStableCallback';
import { getCellsToReveal } from '@/utils/minesweeper/reveal';

// --- Game State ---

type CellStatus = 'hidden' | 'flagged';

export type InteractionMode = 'flag' | 'reveal';

type GameState = {
  cells: CellStatus[][];
  flagCount: number;
  userRevealedCells: { row: number; col: number; value: number }[];
  gameOver: boolean;
};

type GameAction =
  | { type: 'TOGGLE_FLAG'; row: number; col: number }
  | { type: 'REVEAL_CELLS'; cells: { row: number; col: number; value: number }[] }
  | { type: 'GAME_OVER' };

function createInitialState({ height, width }: { height: number; width: number }): GameState {
  return {
    cells: Array.from({ length: height }, () =>
      Array.from({ length: width }, (): CellStatus => 'hidden'),
    ),
    flagCount: 0,
    userRevealedCells: [],
    gameOver: false,
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
    case 'GAME_OVER':
      return { ...state, gameOver: true };
    default:
      return state;
  }
}

export type MinesweeperGame = {
  revealedMap: Map<string, number>;
  cells: CellStatus[][];
  gameOver: boolean;
  remaining: number;
  mode: InteractionMode;
  onCellTap: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
  toggleMode: () => void;
};

export function useMinesweeperGame(puzzle: MinesweeperPuzzle): MinesweeperGame {
  const [state, dispatch] = useReducer(gameReducer, puzzle, createInitialState);
  const [mode, setMode] = useState<InteractionMode>('flag');

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

  const remaining = puzzle.mineCount - state.flagCount;

  const onCellTap = useStableCallback((row: number, col: number) => {
    if (state.gameOver) return;
    const key = `${row},${col}`;
    if (revealedMap.has(key)) return;
    const isFlagged = state.cells[row][col] === 'flagged';
    if (mode === 'flag') {
      dispatch({ type: 'TOGGLE_FLAG', row, col });
      return;
    }
    if (isFlagged) return;
    const result = getCellsToReveal(row, col, puzzle.mineField, puzzle.width, puzzle.height);
    if (result.hitMine) {
      dispatch({ type: 'GAME_OVER' });
    } else {
      dispatch({ type: 'REVEAL_CELLS', cells: result.cells });
    }
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    if (state.gameOver) return;
    if (revealedMap.has(`${row},${col}`)) return;
    dispatch({ type: 'TOGGLE_FLAG', row, col });
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'flag' ? 'reveal' : 'flag'));
  }, []);

  return {
    revealedMap,
    cells: state.cells,
    gameOver: state.gameOver,
    remaining,
    mode,
    onCellTap,
    onCellLongPress,
    toggleMode,
  };
}
