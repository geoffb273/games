import { useMemo } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type MinesweeperPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useMinesweeperGame } from '@/hooks/game/useMinesweeperGame';
import { useTheme } from '@/hooks/useTheme';

import { MinesweeperCell } from './MinesweeperCell';

const CELL_GAP = 2;
const MAX_CELL_SIZE = 44;
const AVAILABLE_HEIGHT_RATIO = 0.6;

type MinesweeperBoardProps = {
  puzzle: MinesweeperPuzzle;
};

export function MinesweeperBoard({ puzzle }: MinesweeperBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const { revealedMap, cells, gameOver, remaining, mode, onCellTap, onCellLongPress, toggleMode } =
    useMinesweeperGame(puzzle);

  const cellSize = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    return Math.min(fromW, fromH, MAX_CELL_SIZE);
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

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
              const isFlagged = !isRevealed && cells[row][col] === 'flagged';

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

      {gameOver && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text type="emphasized_body" textAlign="center" color="textSecondary">
            You hit a mine!
          </Text>
        </Animated.View>
      )}

      {remaining === 0 && !gameOver && (
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
