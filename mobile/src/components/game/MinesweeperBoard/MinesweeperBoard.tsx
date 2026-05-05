import { StyleSheet, View } from 'react-native';

import { type MinesweeperPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { useMinesweeperCompletionAnimation } from '@/hooks/game/minesweeper/useMinesweeperCompletionAnimation';
import {
  type MinesweeperOnSolveInput,
  useMinesweeperGame,
} from '@/hooks/game/minesweeper/useMinesweeperGame';

import { MinesweeperBoardSurface } from './MinesweeperBoardSurface';
import { MinesweeperBoardToolbar } from './MinesweeperBoardToolbar';

export { AVAILABLE_HEIGHT_RATIO, CELL_GAP, MAX_CELL_SIZE } from './minesweeperBoardConstants';
export { MinesweeperBoardSurface } from './MinesweeperBoardSurface';

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

  const { isCompletionAnimationActive, shouldRevealAllCells, isLossRevealActive } =
    useMinesweeperCompletionAnimation({
      isWin,
      isLoss,
      variant,
    });

  return (
    <View style={styles.container}>
      <MinesweeperBoardToolbar
        puzzleName={puzzle.name}
        remaining={remaining}
        mode={mode}
        onToggleMode={toggleMode}
      />

      <MinesweeperBoardSurface
        variant="playable"
        puzzle={puzzle}
        cellSize={cellSize}
        revealedMap={revealedMap}
        cells={cells}
        triggeredMineCell={triggeredMineCell}
        shouldRevealAllCells={shouldRevealAllCells}
        isHinted={isHinted}
        onCellTap={onCellTap}
        onCellLongPress={onCellLongPress}
        isDisabled={isCompletionAnimationActive || isWin || isLoss}
        completionAnimationType={isLoss ? 'explosion' : 'wave'}
        isCompletionAnimationActive={isCompletionAnimationActive}
        isLossRevealActive={isLossRevealActive}
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
});
