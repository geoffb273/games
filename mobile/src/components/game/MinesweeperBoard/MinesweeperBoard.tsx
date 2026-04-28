import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import {
  type MinesweeperGame,
  type MinesweeperOnSolveInput,
  useMinesweeperGame,
} from '@/hooks/game/useMinesweeperGame';
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

type MinesweeperBoardSurfaceBaseProps = {
  puzzle: MinesweeperPuzzle;
  cellSize: number;
  revealedMap: Map<string, number>;
  cells: MinesweeperGame['cells'];
  triggeredMineCell: { row: number; col: number } | null;
};

type StaticMinesweeperBoardSurfaceProps = MinesweeperBoardSurfaceBaseProps & {
  variant: 'static';
  isHinted?: never;
  onCellTap?: never;
  onCellLongPress?: never;
  isDisabled?: never;
  isCompletionAnimationActive?: never;
  completionAnimationType?: never;
  onAnimationComplete?: never;
};

type PlayableMinesweeperBoardSurfaceProps = MinesweeperBoardSurfaceBaseProps & {
  variant: 'playable';
  isHinted: (row: number, col: number) => boolean;
  onCellTap: (row: number, col: number) => void;
  onCellLongPress: (row: number, col: number) => void;
  isDisabled: boolean;
  isCompletionAnimationActive: boolean;
  completionAnimationType: 'wave' | 'explosion';
  onAnimationComplete?: () => void;
};

type MinesweeperBoardSurfaceProps =
  | StaticMinesweeperBoardSurfaceProps
  | PlayableMinesweeperBoardSurfaceProps;

export function MinesweeperBoardSurface({
  variant,
  puzzle,
  cellSize,
  revealedMap,
  cells,
  triggeredMineCell,
  isHinted,
  onCellTap,
  onCellLongPress,
  isDisabled,
  isCompletionAnimationActive,
  completionAnimationType,
  onAnimationComplete,
}: MinesweeperBoardSurfaceProps) {
  const isPlayable = variant === 'playable';

  return (
    <View style={[styles.board, { gap: CELL_GAP }]}>
      {Array.from({ length: puzzle.height }, (_, row) => (
        <View key={row} style={[styles.row, { gap: CELL_GAP }]}>
          {Array.from({ length: puzzle.width }, (__, col) => {
            const key = `${row},${col}`;
            const revealedValue = revealedMap.get(key);
            const isRevealed = revealedValue !== undefined;
            const isFlagged = !isRevealed && cells[row][col] === 'flagged';
            const isHintedFlag = isPlayable && isFlagged && isHinted(row, col);

            return (
              <MinesweeperCell
                key={key}
                row={row}
                col={col}
                size={cellSize}
                isRevealed={isRevealed}
                isFlagged={isFlagged}
                isHintedFlag={isHintedFlag}
                value={revealedValue ?? null}
                isTriggeredMine={triggeredMineCell?.row === row && triggeredMineCell?.col === col}
                onTap={(r, c) => onCellTap?.(r, c)}
                onLongPress={(r, c) => onCellLongPress?.(r, c)}
                completionAnimationType={completionAnimationType ?? 'wave'}
                isCompletionAnimationActive={isCompletionAnimationActive ?? false}
                isLastInWave={row === puzzle.height - 1 && col === puzzle.width - 1}
                onWaveComplete={isPlayable ? onAnimationComplete : undefined}
                isDisabled={!isPlayable || isDisabled}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

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
    isHinted,
    cells,
    remaining,
    triggeredMineCell,
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

  const [isCompletionAnimationActive, setIsCompletionAnimationActive] = useState(false);
  const hasTriggeredCompletionAnimationRef = useRef(false);

  useEffect(() => {
    if (variant !== 'play' || (!isWin && !isLoss) || hasTriggeredCompletionAnimationRef.current)
      return;

    hasTriggeredCompletionAnimationRef.current = true;
    setIsCompletionAnimationActive(true);
  }, [isLoss, isWin, variant]);

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

      <MinesweeperBoardSurface
        variant="playable"
        puzzle={puzzle}
        cellSize={cellSize}
        revealedMap={revealedMap}
        cells={cells}
        triggeredMineCell={triggeredMineCell}
        isHinted={isHinted}
        onCellTap={onCellTap}
        onCellLongPress={onCellLongPress}
        isDisabled={isCompletionAnimationActive || isWin || isLoss}
        completionAnimationType={isLoss ? 'explosion' : 'wave'}
        isCompletionAnimationActive={isCompletionAnimationActive}
        onAnimationComplete={onAnimationComplete}
      />
      {variant === 'play' && (
        <HintButton
          puzzleType={PuzzleType.Minesweeper}
          puzzleId={puzzle.id}
          onHint={onHint}
          minesweeperCurrentState={currentState}
        />
      )}
      {variant === 'play' && (isWin || isLoss) && (
        <GameCompleteText variant={isWin ? 'success' : 'failure'} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
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
