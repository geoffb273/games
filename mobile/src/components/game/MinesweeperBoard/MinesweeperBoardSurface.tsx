import { StyleSheet, View } from 'react-native';

import { type MinesweeperPuzzle } from '@/api/puzzle/puzzle';
import { type MinesweeperGame } from '@/hooks/game/minesweeper/useMinesweeperGame';

import { CELL_GAP } from './minesweeperBoardConstants';
import { MinesweeperCell } from './MinesweeperCell';

type MinesweeperBoardSurfaceBaseProps = {
  puzzle: MinesweeperPuzzle;
  cellSize: number;
  revealedMap: Map<string, number>;
  cells: MinesweeperGame['cells'];
  triggeredMineCell: { row: number; col: number } | null;
  shouldRevealAllCells: boolean;
};

type StaticMinesweeperBoardSurfaceProps = MinesweeperBoardSurfaceBaseProps & {
  variant: 'static';
  isHinted?: never;
  onCellTap?: never;
  onCellLongPress?: never;
  isDisabled?: never;
  isCompletionAnimationActive?: never;
  completionAnimationType?: never;
  isLossRevealActive?: never;
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
  isLossRevealActive: boolean;
  onAnimationComplete?: () => void;
};

type MinesweeperBoardSurfaceProps =
  | StaticMinesweeperBoardSurfaceProps
  | PlayableMinesweeperBoardSurfaceProps;

type MinesweeperCellRenderInput = {
  key: string;
  value: number | null;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
};

function getMinesweeperCellRenderInput({
  puzzle,
  cells,
  revealedMap,
  row,
  col,
  shouldRevealAllCells,
}: Pick<
  MinesweeperBoardSurfaceBaseProps,
  'puzzle' | 'cells' | 'revealedMap' | 'shouldRevealAllCells'
> & {
  row: number;
  col: number;
}): MinesweeperCellRenderInput {
  const key = `${row},${col}`;
  const revealedValue = revealedMap.get(key);
  const mineFieldValue = puzzle.mineField[row][col];
  const isMine = mineFieldValue === 'MINE';
  const isRevealed = revealedValue !== undefined || shouldRevealAllCells;
  const isFlagged = !isRevealed && cells[row][col] === 'flagged';
  const value =
    revealedValue ?? (shouldRevealAllCells && mineFieldValue !== 'MINE' ? mineFieldValue : null);

  return {
    key,
    value,
    isMine,
    isRevealed,
    isFlagged,
  };
}

export function MinesweeperBoardSurface({
  variant,
  puzzle,
  cellSize,
  revealedMap,
  cells,
  triggeredMineCell,
  shouldRevealAllCells,
  isHinted,
  onCellTap,
  onCellLongPress,
  isDisabled,
  isCompletionAnimationActive,
  completionAnimationType,
  isLossRevealActive,
  onAnimationComplete,
}: MinesweeperBoardSurfaceProps) {
  const isPlayable = variant === 'playable';

  return (
    <View style={[styles.board, { gap: CELL_GAP }]}>
      {Array.from({ length: puzzle.height }, (_, row) => (
        <View key={row} style={[styles.row, { gap: CELL_GAP }]}>
          {Array.from({ length: puzzle.width }, (__, col) => {
            const { key, value, isMine, isRevealed, isFlagged } = getMinesweeperCellRenderInput({
              puzzle,
              cells,
              revealedMap,
              row,
              col,
              shouldRevealAllCells,
            });

            return (
              <MinesweeperCell
                key={key}
                row={row}
                col={col}
                size={cellSize}
                isRevealed={isRevealed}
                isFlagged={isFlagged}
                isHintedFlag={isPlayable && isFlagged && isHinted(row, col)}
                value={value}
                isMine={isMine}
                isTriggeredMine={triggeredMineCell?.row === row && triggeredMineCell?.col === col}
                onTap={(r, c) => onCellTap?.(r, c)}
                onLongPress={(r, c) => onCellLongPress?.(r, c)}
                completionAnimationType={completionAnimationType ?? 'wave'}
                isCompletionAnimationActive={isCompletionAnimationActive ?? false}
                isLossRevealActive={isLossRevealActive ?? false}
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

const styles = StyleSheet.create({
  board: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
