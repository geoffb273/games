import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  HashiBoard,
  MAX_CELL_SIZE,
} from '@/components/game/HashiBoard/HashiBoard';
import { COLOR } from '@/constants/color';
import { Shadows, Spacing } from '@/constants/token';

const INSTRUCTIONS_HASHI_PUZZLE: HashiPuzzle = {
  id: 'hashi-instructions-demo',
  dailyChallenge: {
    id: 'hashi-instructions-demo',
    date: new Date(),
  },
  name: 'Example Hashi board',
  description: null,
  attempt: null,
  type: PuzzleType.Hashi,
  width: 5,
  height: 5,
  islands: [
    { row: 0, col: 0, requiredBridges: 1 },
    { row: 3, col: 0, requiredBridges: 1 },
    { row: 3, col: 2, requiredBridges: 3 },
    { row: 0, col: 4, requiredBridges: 3 },
    { row: 0, col: 2, requiredBridges: 5 },
    { row: 4, col: 4, requiredBridges: 1 },
  ],
};

export function InstructionsHashiBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isSolved, setIsSolved] = useState(false);

  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2 - CELL_GAP;
    const availH = screenHeight * (AVAILABLE_HEIGHT_RATIO * 0.5) - CELL_GAP - Spacing.four * 2;
    const fromW = Math.floor(
      (availW - CELL_GAP * (INSTRUCTIONS_HASHI_PUZZLE.width - 1)) / INSTRUCTIONS_HASHI_PUZZLE.width,
    );
    const fromH = Math.floor(
      (availH - CELL_GAP * (INSTRUCTIONS_HASHI_PUZZLE.height - 1)) /
        INSTRUCTIONS_HASHI_PUZZLE.height,
    );
    const rawCellSize = Math.min(fromW, fromH, MAX_CELL_SIZE);
    const cSize = Math.max(20, rawCellSize);

    const gridWidth =
      INSTRUCTIONS_HASHI_PUZZLE.width * cSize + CELL_GAP * (INSTRUCTIONS_HASHI_PUZZLE.width - 1);
    const gridHeight =
      INSTRUCTIONS_HASHI_PUZZLE.height * cSize + CELL_GAP * (INSTRUCTIONS_HASHI_PUZZLE.height - 1);

    return {
      cellSize: cSize,
      boardWidth: gridWidth,
      boardHeight: gridHeight,
    };
  }, [screenWidth, screenHeight]);

  return (
    <View style={styles.container}>
      <HashiBoard
        puzzle={INSTRUCTIONS_HASHI_PUZZLE}
        cellSize={cellSize}
        boardWidth={boardWidth}
        boardHeight={boardHeight}
        onSolve={async () => {
          setIsSolved(true);
        }}
        variant="instructions"
        isDisabled={isSolved}
      />
      {isSolved && (
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
  },
});
