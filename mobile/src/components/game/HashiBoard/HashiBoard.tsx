import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { type HashiOnSolve, useHashiGame } from '@/hooks/game/useHashiGame';

import { HashiBridge } from './HashiBridge';
import { HashiIsland } from './HashiIsland';

export const CELL_GAP = 2;
export const MAX_CELL_SIZE = 44;
export const AVAILABLE_HEIGHT_RATIO = 0.6;

type HashiBoardProps = {
  puzzle: HashiPuzzle;
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  onSolve: HashiOnSolve;
};

export function HashiBoard({
  puzzle,
  cellSize,
  boardWidth,
  boardHeight,
  onSolve,
}: HashiBoardProps) {
  const { connections, bridgeCounts, isValidBridge, onConnectionTap, onHint, currentState } =
    useHashiGame({ puzzle, onSolve });

  useInitialOpenInstructionsEffect({ type: PuzzleType.Hashi });

  const islandPositions = useMemo(() => {
    return puzzle.islands.map((island) => ({
      x: island.col * (cellSize + CELL_GAP) + cellSize / 2,
      y: island.row * (cellSize + CELL_GAP) + cellSize / 2,
    }));
  }, [puzzle.islands, cellSize]);

  const currentBridgesPerIsland = useMemo((): number[] => {
    return connections.reduce<number[]>((counts, conn, ci) => {
      const n = bridgeCounts[ci] ?? 0;
      counts[conn.a] += n;
      counts[conn.b] += n;
      return counts;
    }, new Array(puzzle.islands.length).fill(0));
  }, [puzzle.islands.length, connections, bridgeCounts]);

  return (
    <View style={styles.container}>
      <Text type="h3" textAlign="center">
        {puzzle.name}
      </Text>

      <View style={[styles.boardWrap, { width: boardWidth, height: boardHeight }]}>
        {/* Bridge lines (drawn first, under islands) */}
        {connections.map((conn, ci) => (
          <HashiBridge
            key={ci}
            x1={islandPositions[conn.a].x}
            y1={islandPositions[conn.a].y}
            x2={islandPositions[conn.b].x}
            y2={islandPositions[conn.b].y}
            count={bridgeCounts[ci] as 0 | 1 | 2}
            disabled={bridgeCounts[ci] < 2 && !isValidBridge(ci)}
            onPress={() => onConnectionTap(ci)}
          />
        ))}

        {/* Islands on top */}
        {puzzle.islands.map((island, i) => (
          <HashiIsland
            key={i}
            requiredBridges={island.requiredBridges}
            currentBridges={currentBridgesPerIsland[i] ?? 0}
            x={islandPositions[i].x}
            y={islandPositions[i].y}
            cellSize={cellSize}
          />
        ))}
      </View>

      <HintButton
        puzzleType={PuzzleType.Hashi}
        puzzleId={puzzle.id}
        onHint={onHint}
        hashiCurrentState={currentState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.five,
    paddingTop: Spacing.four,
  },
  boardWrap: {
    position: 'relative',
  },
});
