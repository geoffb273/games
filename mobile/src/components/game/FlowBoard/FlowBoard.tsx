import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import { type FlowPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { useFlowGame } from '@/hooks/game/useFlowGame';

import { FlowCell } from './FlowCell';

const CELL_GAP = 2;
const MAX_CELL_SIZE = 44;
const AVAILABLE_HEIGHT_RATIO = 0.6;
const PAN_MIN_DISTANCE = 4;

/** Distinct colors for flow paths (readable on light and dark backgrounds). */
const FLOW_PAIR_COLORS = [
  '#6B9BD1',
  '#7DCE7D',
  '#E8A95D',
  '#D4737A',
  '#9B7BBF',
  '#5BC0C0',
  '#E895C4',
  '#8B7355',
];

function getPairColor(pairIndex: number): string {
  return FLOW_PAIR_COLORS[pairIndex % FLOW_PAIR_COLORS.length];
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

type FlowBoardProps = {
  puzzle: FlowPuzzle;
};

export function FlowBoard({ puzzle }: FlowBoardProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { grid, setCell, clearPathForPair } = useFlowGame(puzzle);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Flow });

  const { cellSize } = useMemo(() => {
    const availW = screenWidth - Spacing.four * 2;
    const availH = screenHeight * AVAILABLE_HEIGHT_RATIO;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const size = Math.min(fromW, fromH, MAX_CELL_SIZE);
    return { cellSize: size };
  }, [screenWidth, screenHeight, puzzle.width, puzzle.height]);

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
    [handlePanBegin, handlePanMove, handlePanEnd],
  );

  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        'worklet';
        runOnJS(handleTap)(e.x, e.y);
      }),
    [handleTap],
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
                    : '#ccc';
                return (
                  <FlowCell
                    key={`cell-${r}-${c}`}
                    size={cellSize}
                    pairNumber={pairNumber}
                    cellValue={cellValue}
                    color={color}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </GestureDetector>
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
      drawingPairRef.current = null;
      lastCellRef.current = null;
      pathOrderRef.current = [];
      reachedSecondEndpointRef.current = false;
      secondEndpointRef.current = null;
      if (pairNumber == null) return;
      const cell = xyToCell(x, y, cellSize, CELL_GAP, puzzle.width, puzzle.height);
      const endpoint = cell ? getPairAtCell(puzzle.pairs, cell.row, cell.col) : null;
      const endedOnOwnEndpoint = endpoint?.number === pairNumber;
      if (!endedOnOwnEndpoint) {
        clearPathForPair(pairNumber);
      }
    },
    [cellSize, puzzle.width, puzzle.height, puzzle.pairs, clearPathForPair],
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
    gap: CELL_GAP,
  },
});
