import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  FlowBoard,
  MAX_CELL_SIZE,
} from '@/components/game/FlowBoard/FlowBoard';
import { COLOR } from '@/constants/color';
import { Shadows, Spacing } from '@/constants/token';

const INSTRUCTIONS_FLOW_PUZZLE: FlowPuzzle = {
  id: 'flow-instructions-demo',
  name: 'Example Flow board',
  description: null,
  attempt: null,
  type: PuzzleType.Flow,
  width: 5,
  height: 5,
  pairs: [
    {
      number: 1,
      ends: [
        { row: 0, col: 0 },
        { row: 4, col: 4 },
      ],
    },
    {
      number: 2,
      ends: [
        { row: 0, col: 4 },
        { row: 3, col: 1 },
      ],
    },
    {
      number: 3,
      ends: [
        { row: 2, col: 1 },
        { row: 2, col: 3 },
      ],
    },
  ],
};

export function InstructionsFlowBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isSolved, setIsSolved] = useState(false);

  const { cellSize } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * (AVAILABLE_HEIGHT_RATIO * 0.5);
    const fromW = Math.floor(
      (availW - CELL_GAP * (INSTRUCTIONS_FLOW_PUZZLE.width - 1)) / INSTRUCTIONS_FLOW_PUZZLE.width,
    );
    const fromH = Math.floor(
      (availH - CELL_GAP * (INSTRUCTIONS_FLOW_PUZZLE.height - 1)) / INSTRUCTIONS_FLOW_PUZZLE.height,
    );
    const size = Math.min(fromW, fromH, MAX_CELL_SIZE);
    return { cellSize: size };
  }, [screenWidth, screenHeight]);

  return (
    <View style={styles.container}>
      <FlowBoard
        puzzle={INSTRUCTIONS_FLOW_PUZZLE}
        cellSize={cellSize}
        variant="instructions"
        onSolve={async () => {
          setIsSolved(true);
        }}
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
