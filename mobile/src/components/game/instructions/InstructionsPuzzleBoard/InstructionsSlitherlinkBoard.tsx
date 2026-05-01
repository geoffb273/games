import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  MAX_CELL_SIZE,
  SlitherlinkBoard,
} from '@/components/game/SlitherlinkBoard/SlitherlinkBoard';
import { COLOR } from '@/constants/color';
import { Shadows, Spacing } from '@/constants/token';

export const INSTRUCTIONS_SLITHERLINK_PUZZLE: SlitherlinkPuzzle = {
  id: 'slitherlink-instructions-demo',
  dailyChallenge: {
    id: 'slitherlink-instructions-demo',
    date: new Date(),
  },
  name: 'Example Slitherlink board',
  description: null,
  attempt: null,
  type: PuzzleType.Slitherlink,
  width: 3,
  height: 3,
  clues: [
    [2, 3, null],
    [3, 0, 3],
    [null, 3, 2],
  ],
};

export function InstructionsSlitherlinkBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isSolved, setIsSolved] = useState(false);

  const { cellSize } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * (AVAILABLE_HEIGHT_RATIO * 0.5);
    const fromW = Math.floor(
      (availW - CELL_GAP * (INSTRUCTIONS_SLITHERLINK_PUZZLE.width - 1)) /
        INSTRUCTIONS_SLITHERLINK_PUZZLE.width,
    );
    const fromH = Math.floor(
      (availH - CELL_GAP * (INSTRUCTIONS_SLITHERLINK_PUZZLE.height - 1)) /
        INSTRUCTIONS_SLITHERLINK_PUZZLE.height,
    );
    const size = Math.min(fromW, fromH, MAX_CELL_SIZE);
    return { cellSize: size };
  }, [screenWidth, screenHeight]);

  return (
    <View style={styles.container}>
      <SlitherlinkBoard
        puzzle={INSTRUCTIONS_SLITHERLINK_PUZZLE}
        cellSize={cellSize}
        variant="instructions"
        onSolve={async () => {
          setIsSolved(true);
        }}
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
