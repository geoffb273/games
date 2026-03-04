import { useCallback, useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type MinesweeperPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useStableCallback } from '@/hooks/useStableCallback';
import { useTheme } from '@/hooks/useTheme';

import { MinesweeperCell } from './MinesweeperCell';

const CELL_GAP = 2;
const MAX_CELL_SIZE = 44;
const AVAILABLE_HEIGHT_RATIO = 0.6;

// --- Game State ---

type CellStatus = 'hidden' | 'flagged';

type InteractionMode = 'flag' | 'reveal';

type GameState = {
  cells: CellStatus[][];
  flagCount: number;
};

type GameAction = { type: 'TOGGLE_FLAG'; row: number; col: number };

function createInitialState({ height, width }: { height: number; width: number }): GameState {
  return {
    cells: Array.from({ length: height }, () =>
      Array.from({ length: width }, (): CellStatus => 'hidden'),
    ),
    flagCount: 0,
  };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TOGGLE_FLAG': {
      const { row, col } = action;
      const current = state.cells[row][col];
      const next: CellStatus = current === 'flagged' ? 'hidden' : 'flagged';
      return {
        cells: state.cells.map((r, ri) =>
          ri === row ? r.map((c, ci) => (ci === col ? next : c)) : r,
        ),
        flagCount: state.flagCount + (next === 'flagged' ? 1 : -1),
      };
    }
    default:
      return state;
  }
}

type MinesweeperBoardProps = {
  puzzle: MinesweeperPuzzle;
};

export function MinesweeperBoard({ puzzle }: MinesweeperBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const [state, dispatch] = useReducer(gameReducer, puzzle, createInitialState);
  const [mode, setMode] = useState<InteractionMode>('flag');

  const revealedMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const { row, col, value } of puzzle.revealedCells) {
      map.set(`${row},${col}`, value);
    }
    return map;
  }, [puzzle.revealedCells]);

  const cellSize = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    return Math.min(fromW, fromH, MAX_CELL_SIZE);
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

  const remaining = puzzle.mineCount - state.flagCount;

  const onCellTap = useStableCallback((row: number, col: number) => {
    if (mode !== 'flag') return;
    if (revealedMap.has(`${row},${col}`)) return;
    dispatch({ type: 'TOGGLE_FLAG', row, col });
  });

  const onCellLongPress = useStableCallback((row: number, col: number) => {
    if (revealedMap.has(`${row},${col}`)) return;
    dispatch({ type: 'TOGGLE_FLAG', row, col });
  });

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'flag' ? 'reveal' : 'flag'));
  }, []);

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <View style={styles.toolbar}>
        <View style={[styles.toolbarItem, { backgroundColor: theme.backgroundElement }]}>
          <Text type="emphasized_body">
            {remaining} mine{remaining !== 1 ? 's' : ''} left
          </Text>
        </View>
        <Pressable
          onPress={toggleMode}
          style={[
            styles.toolbarItem,
            {
              backgroundColor: mode === 'flag' ? theme.backgroundSelected : theme.backgroundElement,
            },
          ]}
        >
          <Text type="emphasized_body">{mode === 'flag' ? 'Flag' : 'Reveal'}</Text>
        </Pressable>
      </View>

      <View style={[styles.board, { gap: CELL_GAP }]}>
        {Array.from({ length: puzzle.height }, (_, row) => (
          <View key={row} style={[styles.row, { gap: CELL_GAP }]}>
            {Array.from({ length: puzzle.width }, (__, col) => {
              const key = `${row},${col}`;
              const revealedValue = revealedMap.get(key);
              const isRevealed = revealedValue !== undefined;
              const isFlagged = !isRevealed && state.cells[row][col] === 'flagged';

              return (
                <MinesweeperCell
                  key={key}
                  row={row}
                  col={col}
                  size={cellSize}
                  isRevealed={isRevealed}
                  isFlagged={isFlagged}
                  value={revealedValue ?? null}
                  onTap={onCellTap}
                  onLongPress={onCellLongPress}
                />
              );
            })}
          </View>
        ))}
      </View>

      {remaining === 0 && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text type="emphasized_body" textAlign="center" color="textSecondary">
            All mines flagged!
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.four,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  toolbarItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  board: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
