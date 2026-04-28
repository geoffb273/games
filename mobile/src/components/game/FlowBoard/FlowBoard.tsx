import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { useFlowGame } from '@/hooks/game/useFlowGame';
import { triggerHapticLight } from '@/utils/hapticUtils';

import { FlowCell } from './FlowCell';
import { FlowColors } from './flowColor';

export const CELL_GAP = 2;
export const MAX_CELL_SIZE = 44;
export const AVAILABLE_HEIGHT_RATIO = 0.6;
export const PAN_MIN_DISTANCE = 4;

function getPairColor(pairIndex: number): string {
  return FlowColors.pairColors[pairIndex % FlowColors.pairColors.length];
}

function getPairAtCell(
  pairs: FlowPuzzle['pairs'],
  row: number,
  col: number,
): { number: number; index: number } | null {
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    const [a, b] = p.ends;
    if ((a.row === row && a.col === col) || (b.row === row && b.col === col)) {
      return { number: p.number, index: i };
    }
  }
  return null;
}

function xyToCell(
  x: number,
  y: number,
  cellSize: number,
  gap: number,
  width: number,
  height: number,
): { row: number; col: number } | null {
  const step = cellSize + gap;
  const col = Math.floor(x / step);
  const row = Math.floor(y / step);
  if (row >= 0 && row < height && col >= 0 && col < width) {
    return { row, col };
  }
  return null;
}

/** Orthogonally adjacent (up/down/left/right), not diagonal. */
function isAdjacent(a: { row: number; col: number }, b: { row: number; col: number }): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

type FlowBoardVariant = 'play' | 'instructions';

type FlowBoardSurfaceBaseProps = {
  puzzle: FlowPuzzle;
  cellSize: number;
  grid: number[][];
};

type StaticFlowBoardSurfaceProps = FlowBoardSurfaceBaseProps & {
  variant: 'static';
  isCompletionWaveActive?: never;
  onAnimationComplete?: never;
};

type PlayableFlowBoardSurfaceProps = FlowBoardSurfaceBaseProps & {
  variant: 'playable';
  isCompletionWaveActive: boolean;
  onAnimationComplete?: () => void;
};

type FlowBoardSurfaceProps = StaticFlowBoardSurfaceProps | PlayableFlowBoardSurfaceProps;

export function FlowBoardSurface({
  variant,
  puzzle,
  cellSize,
  grid,
  isCompletionWaveActive,
  onAnimationComplete,
}: FlowBoardSurfaceProps) {
  const isPlayable = variant === 'playable';

  return (
    <View style={styles.board}>
      {Array.from({ length: puzzle.height }, (_unusedRow, r) => (
        <View key={`row-${r}`} style={styles.row}>
          {Array.from({ length: puzzle.width }, (_unusedCol, c) => {
            const endpoint = getPairAtCell(puzzle.pairs, r, c);
            const pairNumber = endpoint?.number ?? null;
            const cellValue = grid[r]?.[c] ?? 0;
            const pairIndex =
              endpoint?.index ?? puzzle.pairs.findIndex((p) => p.number === cellValue);
            const color =
              cellValue > 0 || endpoint
                ? getPairColor(pairIndex >= 0 ? pairIndex : cellValue - 1)
                : FlowColors.emptyCell;
            const isLastInWave = r === puzzle.height - 1 && c === puzzle.width - 1;
            return (
              <FlowCell
                key={`cell-${r}-${c}`}
                size={cellSize}
                pairNumber={pairNumber}
                cellValue={cellValue}
                color={color}
                row={r}
                col={c}
                isCompletionWaveActive={isPlayable ? isCompletionWaveActive : false}
                isLastInWave={isLastInWave}
                onWaveComplete={isPlayable ? onAnimationComplete : undefined}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

type FlowBoardProps = {
  puzzle: FlowPuzzle;
  cellSize: number;
  onSolve: ({
    flowSolution,
    durationMs,
    completedAt,
    startedAt,
  }: {
    flowSolution: number[][];
    durationMs: number;
    completedAt: Date;
    startedAt: Date;
  }) => Promise<void>;
  isDisabled?: boolean;
  variant?: FlowBoardVariant;
  onAnimationComplete?: () => void;
};

export function FlowBoard({
  puzzle,
  cellSize,
  onSolve,
  variant = 'play',
  isDisabled = false,
  onAnimationComplete,
}: FlowBoardProps) {
  const { grid, isComplete, setCell, clearPathForPair } = useFlowGame({ puzzle, onSolve });
  const [isCompletionWaveActive, setIsCompletionWaveActive] = useState(false);
  const hasEndGameAnimationTriggered = useRef(false);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Flow, enabled: variant === 'play' });

  useEffect(() => {
    if (!isComplete || variant !== 'play' || hasEndGameAnimationTriggered.current) return;

    hasEndGameAnimationTriggered.current = true;
    setIsCompletionWaveActive(true);
  }, [isComplete, variant]);

  const handleBoardWaveComplete = useCallback(() => {
    setIsCompletionWaveActive(false);
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  const { handlePanBegin, handlePanMove, handlePanEnd, handleTap } = useFlowBoardPan({
    puzzle,
    cellSize,
    grid,
    setCell,
    clearPathForPair,
  });

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(PAN_MIN_DISTANCE)
        .enabled(!isDisabled && !isComplete && !isCompletionWaveActive)
        .onBegin((e) => {
          'worklet';
          runOnJS(handlePanBegin)(e.x, e.y);
        })
        .onUpdate((e) => {
          'worklet';
          runOnJS(handlePanMove)(e.x, e.y);
        })
        .onEnd((e) => {
          'worklet';
          runOnJS(handlePanEnd)(e.x, e.y);
        }),
    [isDisabled, isComplete, isCompletionWaveActive, handlePanBegin, handlePanMove, handlePanEnd],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!isDisabled && !isComplete && !isCompletionWaveActive)
        .onEnd((e) => {
          'worklet';
          runOnJS(handleTap)(e.x, e.y);
        }),
    [handleTap, isComplete, isCompletionWaveActive, isDisabled],
  );

  const composed = useMemo(
    () => Gesture.Exclusive(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <GestureDetector gesture={composed}>
        <FlowBoardSurface
          variant="playable"
          puzzle={puzzle}
          cellSize={cellSize}
          grid={grid}
          isCompletionWaveActive={isCompletionWaveActive}
          onAnimationComplete={handleBoardWaveComplete}
        />
      </GestureDetector>
      {variant === 'play' && isComplete && <GameCompleteText variant="success" />}
    </View>
  );
}

type UseFlowBoardPanParams = {
  puzzle: FlowPuzzle;
  cellSize: number;
  grid: number[][];
  setCell: (row: number, col: number, value: number) => void;
  clearPathForPair: (pairNumber: number) => void;
};

function useFlowBoardPan({
  puzzle,
  cellSize,
  grid,
  setCell,
  clearPathForPair,
}: UseFlowBoardPanParams) {
  const drawingPairRef = useRef<number | null>(null);
  const lastCellRef = useRef<{ row: number; col: number } | null>(null);
  const pathOrderRef = useRef<{ row: number; col: number }[]>([]);
  const reachedSecondEndpointRef = useRef(false);
  const secondEndpointRef = useRef<{ row: number; col: number } | null>(null);

  const handlePanBegin = useCallback(
    (x: number, y: number) => {
      const cell = xyToCell(x, y, cellSize, CELL_GAP, puzzle.width, puzzle.height);
      if (!cell) return;
      const endpoint = getPairAtCell(puzzle.pairs, cell.row, cell.col);
      triggerHapticLight();
      if (endpoint) {
        drawingPairRef.current = endpoint.number;
        reachedSecondEndpointRef.current = false;
        const pair = puzzle.pairs[endpoint.index];
        const [a, b] = pair.ends;
        const other = a.row === cell.row && a.col === cell.col ? b : a;
        secondEndpointRef.current = { row: other.row, col: other.col };
        setCell(cell.row, cell.col, endpoint.number);
        lastCellRef.current = cell;
        pathOrderRef.current = [{ row: cell.row, col: cell.col }];
      }
    },
    [cellSize, puzzle.width, puzzle.height, puzzle.pairs, setCell],
  );

  const handlePanMove = useCallback(
    (x: number, y: number) => {
      const pairNumber = drawingPairRef.current;
      if (pairNumber == null) return;
      const cell = xyToCell(x, y, cellSize, CELL_GAP, puzzle.width, puzzle.height);
      if (!cell) return;
      const last = lastCellRef.current;
      if (last && last.row === cell.row && last.col === cell.col) return;
      const endpointAtCell = getPairAtCell(puzzle.pairs, cell.row, cell.col);
      if (endpointAtCell && endpointAtCell.number !== pairNumber) return;
      const pathOrder = pathOrderRef.current;
      const currentValue = grid[cell.row]?.[cell.col] ?? 0;

      if (currentValue === 0) {
        if (reachedSecondEndpointRef.current) return;
        if (last && !isAdjacent(last, cell)) return;
        const second = secondEndpointRef.current;
        const isSecondEndpoint = second && second.row === cell.row && second.col === cell.col;
        setCell(cell.row, cell.col, pairNumber);
        pathOrder.push({ row: cell.row, col: cell.col });
        lastCellRef.current = cell;
        if (isSecondEndpoint) reachedSecondEndpointRef.current = true;
      } else if (currentValue === pairNumber) {
        const idx = pathOrder.findIndex((p) => p.row === cell.row && p.col === cell.col);
        if (idx >= 0 && idx < pathOrder.length - 1) {
          for (let i = idx + 1; i < pathOrder.length; i++) {
            const p = pathOrder[i];
            setCell(p.row, p.col, 0);
          }
          pathOrderRef.current = pathOrder.slice(0, idx + 1);
          lastCellRef.current = cell;
          if (
            secondEndpointRef.current &&
            secondEndpointRef.current.row === cell.row &&
            secondEndpointRef.current.col === cell.col
          ) {
            reachedSecondEndpointRef.current = true;
          } else {
            reachedSecondEndpointRef.current = false;
          }
        } else {
          const tail = pathOrder[pathOrder.length - 1];
          const isTail = tail && tail.row === cell.row && tail.col === cell.col;
          if (isTail && pathOrder.length > 1) {
            pathOrder.pop();
            setCell(cell.row, cell.col, 0);
            const newTail = pathOrder[pathOrder.length - 1];
            lastCellRef.current = newTail ?? null;
            reachedSecondEndpointRef.current = false;
          }
        }
      }
    },
    [cellSize, puzzle.width, puzzle.height, grid, puzzle.pairs, setCell],
  );

  const handlePanEnd = useCallback(
    (x: number, y: number) => {
      const pairNumber = drawingPairRef.current;
      if (pairNumber == null) return;
      triggerHapticLight();
      const cell = xyToCell(x, y, cellSize, CELL_GAP, puzzle.width, puzzle.height);
      if (cell == null) {
        clearPathForPair(pairNumber);
      } else {
        const endpoint = getPairAtCell(puzzle.pairs, cell.row, cell.col);
        const endedOnOwnEndpoint = endpoint?.number === pairNumber;
        const secondEndpoint = secondEndpointRef.current;
        const endedAdjacentToSecondEndpoint = !!secondEndpoint && isAdjacent(cell, secondEndpoint);

        if (endedAdjacentToSecondEndpoint && secondEndpoint) {
          // Auto-complete by filling in the second endpoint cell so the grid
          // path actually reaches the endpoint for validation.
          setCell(secondEndpoint.row, secondEndpoint.col, pairNumber);
        } else if (!endedOnOwnEndpoint) {
          clearPathForPair(pairNumber);
        }
      }

      drawingPairRef.current = null;
      lastCellRef.current = null;
      pathOrderRef.current = [];
      reachedSecondEndpointRef.current = false;
      secondEndpointRef.current = null;
    },
    [cellSize, puzzle.width, puzzle.height, puzzle.pairs, setCell, clearPathForPair],
  );

  const handleTap = useCallback(
    (x: number, y: number) => {
      const cell = xyToCell(x, y, cellSize, CELL_GAP, puzzle.width, puzzle.height);
      if (!cell) return;
      const endpoint = getPairAtCell(puzzle.pairs, cell.row, cell.col);
      if (endpoint) {
        clearPathForPair(endpoint.number);
      }
    },
    [cellSize, puzzle.width, puzzle.height, puzzle.pairs, clearPathForPair],
  );

  return { handlePanBegin, handlePanMove, handlePanEnd, handleTap };
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
    gap: CELL_GAP,
  },
});
