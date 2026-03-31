import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { FontAwesome } from '@expo/vector-icons';

import { type HashiPuzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { Text } from '@/components/common/Text';
import { GameCompleteText } from '@/components/game/GameCompleteText';
import { HintButton } from '@/components/game/HintButton';
import { Spacing } from '@/constants/token';
import { useInitialOpenInstructionsEffect } from '@/hooks/game/instructions/useInitialOpenInstructions.ts';
import { type HashiOnSolve, useHashiGame } from '@/hooks/game/useHashiGame';
import { useTheme } from '@/hooks/useTheme';

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
  variant?: 'play' | 'instructions';
  isDisabled?: boolean;
  onAnimationComplete?: () => void;
};

export function HashiBoard({
  puzzle,
  cellSize,
  boardWidth,
  boardHeight,
  onSolve,
  variant = 'play',
  isDisabled = false,
  onAnimationComplete,
}: HashiBoardProps) {
  const {
    connections,
    bridgeCounts,
    isValidBridge,
    onConnectionTap,
    onClearPress,
    onHint,
    currentState,
    isComplete,
    onIslandPress,
    onUndoPress,
    isUndoEnabled,
  } = useHashiGame({ puzzle, onSolve });
  const [isCompletionWaveActive, setIsCompletionWaveActive] = useState(false);
  const hasEndGameAnimationTriggered = useRef(false);
  const theme = useTheme();

  useEffect(() => {
    if (!isComplete || variant !== 'play' || hasEndGameAnimationTriggered.current) return;
    setIsCompletionWaveActive(true);
    hasEndGameAnimationTriggered.current = true;
  }, [isComplete, variant]);

  useInitialOpenInstructionsEffect({ type: PuzzleType.Hashi, enabled: variant === 'play' });

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

  const lastIslandIndex = useMemo(() => {
    if (puzzle.islands.length === 0) return -1;

    return puzzle.islands.reduce((currentMaxIndex, island, index, islands) => {
      const currentMaxIsland = islands[currentMaxIndex];
      const currentMaxPosition = currentMaxIsland.row + currentMaxIsland.col;
      const islandPosition = island.row + island.col;

      return islandPosition > currentMaxPosition ? index : currentMaxIndex;
    }, 0);
  }, [puzzle.islands]);

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
            disabled={
              isCompletionWaveActive || isDisabled || (bridgeCounts[ci] < 2 && !isValidBridge(ci))
            }
            onPress={() => onConnectionTap(ci)}
          />
        ))}

        {/* Islands on top */}
        {puzzle.islands.map((island, i) => (
          <HashiIsland
            key={i}
            isDisabled={isDisabled}
            requiredBridges={island.requiredBridges}
            currentBridges={currentBridgesPerIsland[i] ?? 0}
            x={islandPositions[i].x}
            y={islandPositions[i].y}
            cellSize={cellSize}
            isCompletionWaveActive={isCompletionWaveActive}
            isLastInWave={i === lastIslandIndex}
            onWaveComplete={onAnimationComplete}
            onPress={() => onIslandPress({ row: island.row, col: island.col })}
          />
        ))}
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
            puzzleType={PuzzleType.Hashi}
            puzzleId={puzzle.id}
            onHint={onHint}
            hashiCurrentState={currentState}
          />
          <Button
            variant="outline"
            onPress={onClearPress}
            disabled={isDisabled || isCompletionWaveActive || isComplete}
            leadingIcon={<FontAwesome name="trash-o" size={24} color={theme.text} />}
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
    gap: Spacing.five,
    paddingTop: Spacing.four,
  },
  boardWrap: {
    position: 'relative',
  },
  actions: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    justifyContent: 'center',
    flexDirection: 'row',
  },
});
