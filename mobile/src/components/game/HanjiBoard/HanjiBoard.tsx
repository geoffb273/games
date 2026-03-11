import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/theme';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { useHanjiGame } from '@/hooks/game/useHanjiGame';
import { useTheme } from '@/hooks/useTheme';

import { HanjiCell } from './HanjiCell';

const CELL_GAP = 2;
const MAX_CELL_SIZE = 44;
const AVAILABLE_HEIGHT_RATIO = 0.6;
const CLUE_LINE_HEIGHT = 14;

type HanjiBoardProps = {
  puzzle: HanjiPuzzle;
};

export function HanjiBoard({ puzzle }: HanjiBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const { cells, isComplete, onCellTap, onCellLongPress, onHint, currentState } =
    useHanjiGame(puzzle);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Hanji });

  const { cellSize, rowClueWidth, colClueHeight, boardWidth } = useMemo(() => {
    const maxRowClueLen = Math.max(0, ...puzzle.rowClues.map((r) => r.length));
    const maxColClueLen = Math.max(0, ...puzzle.colClues.map((c) => c.length));
    const rClueW = maxRowClueLen > 0 ? maxRowClueLen * 10 + Spacing.two : 0;
    const cClueH = maxColClueLen > 0 ? maxColClueLen * CLUE_LINE_HEIGHT + Spacing.one : 0;

    const availW = screenWidth - Spacing.four * 2 - rClueW - CELL_GAP;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO - cClueH - CELL_GAP - Spacing.four * 2;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const rawCellSize = Math.min(fromW, fromH, MAX_CELL_SIZE);
    const cSize = Math.max(12, rawCellSize);

    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const totalWidth = rClueW + CELL_GAP + gridWidth;

    return {
      cellSize: cSize,
      rowClueWidth: Math.max(rClueW, 24),
      colClueHeight: Math.max(cClueH, 20),
      boardWidth: totalWidth,
    };
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height, puzzle.rowClues, puzzle.colClues]);

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <View style={[styles.boardWrap, { width: boardWidth }]}>
        {/* Top row: corner spacer + column clues */}
        <View style={[styles.corner, { width: rowClueWidth, height: colClueHeight }]} />
        <View style={[styles.colCluesRow, { gap: CELL_GAP }]}>
          {Array.from({ length: puzzle.width }, (_, c) => (
            <View
              key={c}
              style={[
                styles.colClueCell,
                {
                  width: cellSize,
                  minHeight: colClueHeight,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              {puzzle.colClues[c].map((n, i) => (
                <Text key={i} type="emphasized_body" color="textSecondary">
                  {n}
                </Text>
              ))}
            </View>
          ))}
        </View>

        {/* Bottom row: row clues + grid */}
        <View style={[styles.rowCluesCol, { width: rowClueWidth, gap: CELL_GAP }]}>
          {Array.from({ length: puzzle.height }, (_, r) => (
            <View
              key={r}
              style={[
                styles.rowClueCell,
                {
                  height: cellSize,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              <View style={styles.rowClueNums}>
                {puzzle.rowClues[r].map((n, i) => (
                  <Text key={i} type="emphasized_body" color="textSecondary">
                    {n}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.grid, { gap: CELL_GAP }]}>
          {Array.from({ length: puzzle.height }, (_, rowIdx) => (
            <View key={rowIdx} style={[styles.gridRow, { gap: CELL_GAP }]}>
              {Array.from({ length: puzzle.width }, (__, colIdx) => (
                <HanjiCell
                  key={`${rowIdx},${colIdx}`}
                  row={rowIdx}
                  col={colIdx}
                  size={cellSize}
                  state={cells[rowIdx][colIdx]}
                  onTap={onCellTap}
                  onLongPress={onCellLongPress}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {isComplete && (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text type="emphasized_body" textAlign="center" color="textSecondary">
            Puzzle complete!
          </Text>
        </Animated.View>
      )}

      <HintButton
        puzzleType={PuzzleType.Hanji}
        puzzleId={puzzle.id}
        onHint={onHint}
        hanjiCurrentState={currentState}
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
  boardWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  corner: {},
  colCluesRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  colClueCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
  },
  rowCluesCol: {},
  rowClueCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: Spacing.one,
  },
  rowClueNums: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grid: {
    alignItems: 'center',
  },
  gridRow: {
    flexDirection: 'row',
  },
});
