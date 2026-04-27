import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { type HashiPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { CELL_GAP, HashiBoardSurface } from '@/components/game/HashiBoard/HashiBoard';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { findConnections } from '@/utils/hashi/connections';
import { formatDuration } from '@/utils/timeUtils';

const SHARE_CARD_WIDTH = 720;
const SHARE_CARD_PADDING = Spacing.five;
const BOARD_TARGET_SIZE = SHARE_CARD_WIDTH - SHARE_CARD_PADDING * 2;

type ShareHashiBoardProps = {
  puzzle: HashiPuzzle;
  durationMs: number | null | undefined;
};

/**
 * Static, non-interactive rendering of an unsolved Hashi board, sized for off-platform sharing.
 */
export function ShareHashiBoard({ puzzle, durationMs }: ShareHashiBoardProps) {
  const theme = useTheme();
  const formattedDuration = formatDuration(durationMs);

  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    const fromW = Math.floor((BOARD_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((BOARD_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const cSize = Math.max(24, Math.min(fromW, fromH));
    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const gridHeight = puzzle.height * cSize + CELL_GAP * (puzzle.height - 1);
    return { cellSize: cSize, boardWidth: gridWidth, boardHeight: gridHeight };
  }, [puzzle.width, puzzle.height]);

  const staticConnections = useMemo(() => findConnections(puzzle.islands), [puzzle.islands]);

  return (
    <View style={[styles.card, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text type="h2" textAlign="center">
          {puzzle.name}
        </Text>
      </View>
      <HashiBoardSurface
        variant="static"
        puzzle={puzzle}
        cellSize={cellSize}
        boardWidth={boardWidth}
        boardHeight={boardHeight}
        connections={staticConnections}
      />

      <View style={[styles.divider, { backgroundColor: theme.rule }]} />

      <View style={styles.footer}>
        <Text type="caption" color="textSecondary">
          Solved in
        </Text>
        <Text type="h3">{formattedDuration ?? '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    paddingVertical: SHARE_CARD_PADDING,
    paddingHorizontal: SHARE_CARD_PADDING,
    borderRadius: Radii.lg,
    alignItems: 'center',
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  divider: {
    height: 1,
    alignSelf: 'stretch',
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.half,
  },
});
