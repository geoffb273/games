import { useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import {
  AVAILABLE_HEIGHT_RATIO,
  CELL_GAP,
  CLUE_LINE_HEIGHT,
  HanjiBoard,
  MAX_CELL_SIZE,
} from '@/components/game/HanjiBoard/HanjiBoard';
import { COLOR } from '@/constants/color';
import { Shadows, Spacing } from '@/constants/token';

const INSTRUCTIONS_HANJI_PUZZLE: HanjiPuzzle = {
  id: 'hanji-instructions-demo',
  name: 'Example Hanji board',
  description: null,
  attempt: null,
  type: PuzzleType.Hanji,
  width: 5,
  height: 5,
  rowClues: [[1], [1, 3], [1, 1], [4], [3]],
  colClues: [[2, 1], [2], [1, 2], [2, 1], [3]],
};

export function InstructionsHanjiBoard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [isSolved, setIsSolved] = useState(false);

  const { cellSize, rowClueWidth, colClueHeight, boardWidth } = useMemo(() => {
    const maxRowClueLen = Math.max(0, ...INSTRUCTIONS_HANJI_PUZZLE.rowClues.map((r) => r.length));
    const maxColClueLen = Math.max(0, ...INSTRUCTIONS_HANJI_PUZZLE.colClues.map((c) => c.length));
    const rClueW = maxRowClueLen > 0 ? maxRowClueLen * 10 + Spacing.two : 0;
    const cClueH = maxColClueLen > 0 ? maxColClueLen * CLUE_LINE_HEIGHT + Spacing.one : 0;

    const availW = screenWidth - Spacing.four * 2 - rClueW - CELL_GAP;
    const availH =
      screenHeight * (AVAILABLE_HEIGHT_RATIO * 0.5) - cClueH - CELL_GAP - Spacing.four * 2;
    const fromW = Math.floor(
      (availW - CELL_GAP * (INSTRUCTIONS_HANJI_PUZZLE.width - 1)) / INSTRUCTIONS_HANJI_PUZZLE.width,
    );
    const fromH = Math.floor(
      (availH - CELL_GAP * (INSTRUCTIONS_HANJI_PUZZLE.height - 1)) /
        INSTRUCTIONS_HANJI_PUZZLE.height,
    );
    const rawCellSize = Math.min(fromW, fromH, MAX_CELL_SIZE);
    const cSize = Math.max(12, rawCellSize);

    const gridWidth =
      INSTRUCTIONS_HANJI_PUZZLE.width * cSize + CELL_GAP * (INSTRUCTIONS_HANJI_PUZZLE.width - 1);
    const totalWidth = rClueW + CELL_GAP + gridWidth;

    return {
      cellSize: cSize,
      rowClueWidth: Math.max(rClueW, 24),
      colClueHeight: Math.max(cClueH, 20),
      boardWidth: totalWidth,
    };
  }, [screenWidth, screenHeight]);

  return (
    <View style={styles.container}>
      <HanjiBoard
        puzzle={INSTRUCTIONS_HANJI_PUZZLE}
        cellSize={cellSize}
        rowClueWidth={rowClueWidth}
        colClueHeight={colClueHeight}
        boardWidth={boardWidth}
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
