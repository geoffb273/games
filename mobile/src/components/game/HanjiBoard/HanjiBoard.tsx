import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { type HanjiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { type HanjiOnSolve, useHanjiGame } from '@/hooks/game/useHanjiGame';
import { useTheme } from '@/hooks/useTheme';

import { HanjiCell } from './HanjiCell';

export const CELL_GAP = 2;
export const MAX_CELL_SIZE = 44;
export const AVAILABLE_HEIGHT_RATIO = 0.6;
export const CLUE_LINE_HEIGHT = 14;

type HanjiBoardProps = {
  puzzle: HanjiPuzzle;
  cellSize: number;
  rowClueWidth: number;
  colClueHeight: number;
  boardWidth: number;
  onSolve: HanjiOnSolve;
  variant?: 'play' | 'instructions';
  isDisabled?: boolean;
  onAnimationComplete?: () => void;
};

export function HanjiBoard({
  puzzle,
  cellSize,
  rowClueWidth,
  colClueHeight,
  boardWidth,
  onSolve,
  variant = 'play',
  isDisabled = false,
  onAnimationComplete,
}: HanjiBoardProps) {
  const [isCompletionWaveActive, setIsCompletionWaveActive] = useState(false);
  const hasTriggeredShimmerRef = useRef(false);

  const theme = useTheme();
  const {
    cells,
    onCellTap,
    onCellLongPress,
    onUndoPress,
    isUndoEnabled,
    onClearPress,
    onHint,
    currentState,
    isComplete,
  } = useHanjiGame({
    puzzle,
    onSolve,
  });

  // Detect a fresh completion for this puzzle while in play variant, so we can play a one-off completion wave
  useEffect(() => {
    if (variant !== 'play' || !isComplete || hasTriggeredShimmerRef.current) return;

    hasTriggeredShimmerRef.current = true;
    setIsCompletionWaveActive(true);
  }, [isComplete, variant]);

  const lastFilledCell = useMemo(() => {
    let cellPos: { row: number; col: number } | null = null;

    for (let row = 0; row < puzzle.height; row++) {
      for (let col = 0; col < puzzle.width; col++) {
        if (cells[row][col] !== 'filled') continue;

        if (cellPos == null) {
          cellPos = { row, col };
          continue;
        }

        const { row: lastRow, col: lastCol } = cellPos;

        if (lastRow + lastCol < row + col) {
          cellPos = { row, col };
        }
      }
    }

    return cellPos;
  }, [cells, puzzle.height, puzzle.width]);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Hanji, enabled: variant === 'play' });

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
                  isDisabled={isDisabled || isComplete}
                  isCompletionWaveActive={isCompletionWaveActive}
                  isLastInWave={rowIdx === lastFilledCell?.row && colIdx === lastFilledCell?.col}
                  onWaveComplete={onAnimationComplete}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
      {variant === 'play' && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={onUndoPress}
            leadingIcon={<FontAwesome name="undo" size={24} color={theme.text} />}
            disabled={isDisabled || isCompletionWaveActive || isComplete || !isUndoEnabled}
          />
          <HintButton
            puzzleType={PuzzleType.Hanji}
            puzzleId={puzzle.id}
            onHint={onHint}
            hanjiCurrentState={currentState}
          />
          <Button
            variant="outline"
            onPress={onClearPress}
            leadingIcon={<FontAwesome name="trash-o" size={24} color={theme.text} />}
            disabled={isDisabled || isCompletionWaveActive || isComplete}
          />
        </View>
      )}
      {variant === 'play' && isComplete && <GameCompleteText variant="success" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.four,
    paddingTop: Spacing.four,
    justifyContent: 'center',
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
  actions: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
