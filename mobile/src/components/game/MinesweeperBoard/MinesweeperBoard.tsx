import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { type MinesweeperOnSolveInput, useMinesweeperGame } from '@/hooks/game/useMinesweeperGame';
import { useTheme } from '@/hooks/useTheme';

import { MinesweeperCell } from './MinesweeperCell';

export const CELL_GAP = 2;
export const MAX_CELL_SIZE = 44;
export const AVAILABLE_HEIGHT_RATIO = 0.6;

type MinesweeperBoardProps = {
  puzzle: MinesweeperPuzzle;
  cellSize: number;
  onSolve: (input: MinesweeperOnSolveInput) => Promise<void>;
  variant?: 'play' | 'instructions';
  onAnimationComplete?: () => void;
};

export function MinesweeperBoard({
  puzzle,
  cellSize,
  onSolve,
  variant = 'play',
  onAnimationComplete,
}: MinesweeperBoardProps) {
  const theme = useTheme();
  const {
    revealedMap,
    cells,
    remaining,
    isWin,
    isLoss,
    mode,
    onCellTap,
    onCellLongPress,
    toggleMode,
    onHint,
    currentState,
  } = useMinesweeperGame({ puzzle, onSolve });

  useInitialOpenInstructionsEffect({
    type: PuzzleType.Minesweeper,
    enabled: variant === 'play',
  });

  const [isCompletionWaveActive, setIsCompletionWaveActive] = useState(false);
  const hasTriggeredCompletionWaveRef = useRef(false);

  useEffect(() => {
    if (variant !== 'play' || !isWin || hasTriggeredCompletionWaveRef.current) return;

    hasTriggeredCompletionWaveRef.current = true;
    setIsCompletionWaveActive(true);
  }, [isWin, variant]);

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
                  isCompletionWaveActive={isCompletionWaveActive}
                  isLastInWave={row === puzzle.height - 1 && col === puzzle.width - 1}
                  onWaveComplete={onAnimationComplete}
                  isDisabled={isCompletionWaveActive || isWin || isLoss}
                />
              );
            })}
          </View>
        ))}
      </View>
      {variant === 'play' && (
        <HintButton
          puzzleType={PuzzleType.Minesweeper}
          puzzleId={puzzle.id}
          onHint={onHint}
          minesweeperCurrentState={currentState}
        />
      )}
      {variant === 'play' && isWin && <GameCompleteText />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
