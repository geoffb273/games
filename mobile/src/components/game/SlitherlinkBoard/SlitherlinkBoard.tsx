import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PuzzleType, type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { type SlitherlinkOnSolveInput, useSlitherlinkGame } from '@/hooks/game/useSlitherlinkGame';

import { SlitherlinkCell } from './SlitherlinkCell';

export const CELL_GAP = 2;
export const MAX_CELL_SIZE = 60;
export const AVAILABLE_HEIGHT_RATIO = 0.6;

type SlitherlinkEdgeState = 'empty' | 'line';

type SlitherlinkBoardSurfaceBaseProps = {
  puzzle: SlitherlinkPuzzle;
  cellSize: number;
  horizontal: SlitherlinkEdgeState[][];
  vertical: SlitherlinkEdgeState[][];
};

type StaticSlitherlinkBoardSurfaceProps = SlitherlinkBoardSurfaceBaseProps & {
  variant: 'static';
  isHorizontalEdgeHinted?: never;
  isVerticalEdgeHinted?: never;
  onHorizontalEdgePress?: never;
  onVerticalEdgePress?: never;
  isDisabled?: never;
  isCompletionWaveActive?: never;
  onAnimationComplete?: never;
};

type PlayableSlitherlinkBoardSurfaceProps = SlitherlinkBoardSurfaceBaseProps & {
  variant: 'playable';
  isHorizontalEdgeHinted: (row: number, col: number) => boolean;
  isVerticalEdgeHinted: (row: number, col: number) => boolean;
  onHorizontalEdgePress: (row: number, col: number) => void;
  onVerticalEdgePress: (row: number, col: number) => void;
  isDisabled: boolean;
  isCompletionWaveActive: boolean;
  onAnimationComplete?: () => void;
};

type SlitherlinkBoardSurfaceProps =
  | StaticSlitherlinkBoardSurfaceProps
  | PlayableSlitherlinkBoardSurfaceProps;

export function SlitherlinkBoardSurface({
  puzzle,
  cellSize,
  horizontal,
  vertical,
  variant,
  isCompletionWaveActive,
  isDisabled,
  isHorizontalEdgeHinted,
  isVerticalEdgeHinted,
  onAnimationComplete,
  onHorizontalEdgePress,
  onVerticalEdgePress,
}: SlitherlinkBoardSurfaceProps) {
  const isPlayable = variant === 'playable';

  return (
    <View style={styles.board}>
      {Array.from({ length: puzzle.height }, (_unusedRow, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {Array.from({ length: puzzle.width }, (_unusedCol, c) => {
            const clue = puzzle.clues[r][c];
            const topState = horizontal[r]?.[c] ?? 'empty';
            const bottomState = horizontal[r + 1]?.[c] ?? 'empty';
            const leftState = vertical[r]?.[c] ?? 'empty';
            const rightState = vertical[r]?.[c + 1] ?? 'empty';
            const isTopHinted = isPlayable && isHorizontalEdgeHinted(r, c);
            const isBottomHinted = isPlayable && isHorizontalEdgeHinted(r + 1, c);
            const isLeftHinted = isPlayable && isVerticalEdgeHinted(r, c);
            const isRightHinted = isPlayable && isVerticalEdgeHinted(r, c + 1);
            const isLastInWave = r === puzzle.height - 1 && c === puzzle.width - 1;

            return (
              <SlitherlinkCell
                key={`cell-${r}-${c}`}
                size={cellSize}
                clue={clue}
                top={topState}
                left={leftState}
                bottom={bottomState}
                right={rightState}
                isTopHinted={isTopHinted}
                isLeftHinted={isLeftHinted}
                isBottomHinted={isBottomHinted}
                isRightHinted={isRightHinted}
                onPressTop={() => onHorizontalEdgePress?.(r, c)}
                onPressLeft={() => onVerticalEdgePress?.(r, c)}
                onPressBottom={() => onHorizontalEdgePress?.(r + 1, c)}
                onPressRight={() => onVerticalEdgePress?.(r, c + 1)}
                showBottomEdge={r === puzzle.height - 1}
                showRightEdge={c === puzzle.width - 1}
                isDisabled={!isPlayable || isDisabled}
                isCompletionWaveActive={isCompletionWaveActive ?? false}
                waveDelayNumber={r + c}
                isLastInWave={isLastInWave}
                onWaveComplete={onAnimationComplete}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

type SlitherlinkBoardProps = {
  puzzle: SlitherlinkPuzzle;
  cellSize: number;
  onSolve: (input: SlitherlinkOnSolveInput) => Promise<void>;
  variant?: 'play' | 'instructions';
  onAnimationComplete?: () => void;
};

export function SlitherlinkBoard({
  puzzle,
  cellSize,
  onSolve,
  variant = 'play',
  onAnimationComplete,
}: SlitherlinkBoardProps) {
  const {
    horizontal,
    vertical,
    isHorizontalEdgeHinted,
    isVerticalEdgeHinted,
    onHorizontalEdgePress,
    onVerticalEdgePress,
    onClearPress,
    onHint,
    currentState,
    isComplete,
    isUndoEnabled,
    onUndoPress,
  } = useSlitherlinkGame({ puzzle, onSolve });

  const [isCompletionWaveActive, setIsCompletionWaveActive] = useState(false);
  const hasEndGameAnimationTriggered = useRef(false);

  useEffect(() => {
    if (!isComplete || variant !== 'play' || hasEndGameAnimationTriggered.current) return;
    setIsCompletionWaveActive(true);
    hasEndGameAnimationTriggered.current = true;
  }, [isComplete, variant]);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Slitherlink });

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <SlitherlinkBoardSurface
        variant="playable"
        puzzle={puzzle}
        cellSize={cellSize}
        horizontal={horizontal}
        vertical={vertical}
        isHorizontalEdgeHinted={isHorizontalEdgeHinted}
        isVerticalEdgeHinted={isVerticalEdgeHinted}
        onHorizontalEdgePress={onHorizontalEdgePress}
        onVerticalEdgePress={onVerticalEdgePress}
        isDisabled={isCompletionWaveActive}
        isCompletionWaveActive={isCompletionWaveActive}
        onAnimationComplete={onAnimationComplete}
      />

      {variant === 'play' && (
        <View style={styles.actions}>
          <Button
            variant="outline"
            onPress={onUndoPress}
            disabled={isCompletionWaveActive || isComplete || !isUndoEnabled}
            leadingIcon="undo"
          />
          <HintButton
            puzzleType={PuzzleType.Slitherlink}
            puzzleId={puzzle.id}
            onHint={onHint}
            slitherlinkCurrentState={currentState}
          />
          <Button
            variant="outline"
            onPress={onClearPress}
            disabled={isCompletionWaveActive || isComplete}
            leadingIcon="trash-o"
          />
        </View>
      )}
      {variant === 'play' && isComplete && <GameCompleteText variant="success" />}
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
  board: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  actions: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
  },
});
