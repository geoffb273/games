import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  MAX_CELL_SIZE,
  MinesweeperBoard,
} from '@/components/game/MinesweeperBoard/MinesweeperBoard';
import { COLOR } from '@/constants/color';
import { Shadows, Spacing } from '@/constants/token';

const INSTRUCTIONS_MINESWEEPER_PUZZLE: MinesweeperPuzzle = {
  id: 'minesweeper-instructions-demo',
  dailyChallenge: {
    id: 'minesweeper-instructions-demo',
    date: new Date(),
  },
  name: 'Example Minesweeper board',
  description: null,
  attempt: null,
  type: PuzzleType.Minesweeper,
  width: 5,
  height: 5,
  mineCount: 6,
  mineField: [
    [0, 1, 'MINE', 1, 0],
    [0, 1, 1, 2, 1],
    [0, 0, 1, 3, 'MINE'],
    [1, 1, 1, 'MINE', 'MINE'],
    ['MINE', 1, 1, 3, 'MINE'],
  ],
  revealedCells: [
    { row: 2, col: 0, value: 0 },
    { row: 1, col: 0, value: 0 },
    { row: 1, col: 1, value: 1 },
    { row: 2, col: 1, value: 0 },
    { row: 3, col: 0, value: 1 },
    { row: 3, col: 1, value: 1 },
    { row: 0, col: 0, value: 0 },
    { row: 0, col: 1, value: 1 },
    { row: 1, col: 2, value: 1 },
    { row: 2, col: 2, value: 1 },
    { row: 3, col: 2, value: 1 },
  ],
};

type MinesweeperGameState = 'playing' | 'lost' | 'solved';

export function InstructionsMinesweeperBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [state, setState] = useState<MinesweeperGameState>('playing');
  const [boardKey, setBoardKey] = useState(0);

  const { cellSize } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * (AVAILABLE_HEIGHT_RATIO * 0.5);
    const fromW = Math.floor(
      (availW - CELL_GAP * (INSTRUCTIONS_MINESWEEPER_PUZZLE.width - 1)) /
        INSTRUCTIONS_MINESWEEPER_PUZZLE.width,
    );
    const fromH = Math.floor(
      (availH - CELL_GAP * (INSTRUCTIONS_MINESWEEPER_PUZZLE.height - 1)) /
        INSTRUCTIONS_MINESWEEPER_PUZZLE.height,
    );
    const size = Math.min(fromW, fromH, MAX_CELL_SIZE);
    return { cellSize: size };
  }, [screenWidth, screenHeight]);

  return (
    <View style={styles.container}>
      <MinesweeperBoard
        key={boardKey}
        puzzle={INSTRUCTIONS_MINESWEEPER_PUZZLE}
        cellSize={cellSize}
        variant="instructions"
        onSolve={async ({ success }) => {
          if (success) {
            setState('solved');
          } else {
            setState('lost');
          }
        }}
      />
      {state === 'lost' && (
        <Animated.View style={styles.lostOverlay} entering={FadeIn.springify()}>
          <View style={styles.lostBadge}>
            <Text type="h3" _colorOverride={COLOR.white}>
              You Lost
            </Text>
            <View style={styles.buttonWrap}>
              <Button
                variant="secondary"
                onPress={() => {
                  setState('playing');
                  setBoardKey((k) => k + 1);
                }}
              >
                Try again
              </Button>
            </View>
          </View>
        </Animated.View>
      )}
      {state === 'solved' && (
        <Animated.View style={styles.solvedOverlay} entering={FadeIn.springify()}>
          <View style={styles.solvedBadge}>
            <Text type="h3" _colorOverride={COLOR.white}>
              Solved
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  lostOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lostBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: COLOR.black,
    ...Shadows.subtle,
    alignItems: 'center',
    gap: Spacing.two,
  },
  buttonWrap: {
    marginTop: Spacing.one,
  },
  solvedOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solvedBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    backgroundColor: COLOR.black,
    ...Shadows.subtle,
    alignItems: 'center',
    gap: Spacing.two,
  },
});
