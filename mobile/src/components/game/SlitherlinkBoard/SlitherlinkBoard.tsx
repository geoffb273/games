import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/theme';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { useSlitherlinkGame } from '@/hooks/game/useSlitherlinkGame';

import { SlitherlinkCell } from './SlitherlinkCell';

const CELL_GAP = 2;
const MAX_CELL_SIZE = 44;
const AVAILABLE_HEIGHT_RATIO = 0.6;

type SlitherlinkBoardProps = {
  puzzle: SlitherlinkPuzzle;
};

export function SlitherlinkBoard({ puzzle }: SlitherlinkBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { horizontal, vertical, onHorizontalEdgePress, onVerticalEdgePress, onHint, currentState } =
    useSlitherlinkGame(puzzle);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Slitherlink });

  const { cellSize } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const size = Math.min(fromW, fromH, MAX_CELL_SIZE);
    return {
      cellSize: size,
    };
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <View style={styles.board}>
        {Array.from({ length: puzzle.height }, (_unusedRow, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {Array.from({ length: puzzle.width }, (_unusedCol, c) => {
              const clue = puzzle.clues[r][c];
              const topState = horizontal[r]?.[c] ?? 'empty';
              const bottomState = horizontal[r + 1]?.[c] ?? 'empty';
              const leftState = vertical[r]?.[c] ?? 'empty';
              const rightState = vertical[r]?.[c + 1] ?? 'empty';

              return (
                <SlitherlinkCell
                  key={`cell-${r}-${c}`}
                  size={cellSize}
                  clue={clue}
                  top={topState}
                  left={leftState}
                  bottom={bottomState}
                  right={rightState}
                  onPressTop={() => onHorizontalEdgePress(r, c)}
                  onPressLeft={() => onVerticalEdgePress(r, c)}
                  onPressBottom={() => onHorizontalEdgePress(r + 1, c)}
                  onPressRight={() => onVerticalEdgePress(r, c + 1)}
                  showBottomEdge={r === puzzle.height - 1}
                  showRightEdge={c === puzzle.width - 1}
                />
              );
            })}
          </View>
        ))}
      </View>

      <HintButton
        puzzleType={PuzzleType.Slitherlink}
        puzzleId={puzzle.id}
        onHint={onHint}
        slitherlinkCurrentState={currentState}
      />
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
  board: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
