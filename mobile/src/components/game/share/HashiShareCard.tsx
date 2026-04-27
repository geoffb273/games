import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { type HashiPuzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { type HashiCompletionData } from '@/store/puzzleCompletionStore';
import { Radii, Spacing } from '@/constants/token';
import { ThemeColor } from '@/constants/theme';
import { findConnections } from '@/utils/hashi/connections';
import { formatDuration } from '@/utils/timeUtils';

const SHARE_CARD_WIDTH = 720;
const SHARE_CARD_PADDING = Spacing.five;
const BOARD_TARGET_SIZE = SHARE_CARD_WIDTH - SHARE_CARD_PADDING * 2;
const CELL_GAP = 4;
const ISLAND_RADIUS_RATIO = 0.4;
const BRIDGE_THICKNESS = 6;
const BRIDGE_OFFSET = 7;
const ISLAND_BORDER_WIDTH = 3;

type HashiShareCardProps = {
  puzzle: HashiPuzzle;
  completion: HashiCompletionData;
  durationMs: number | null | undefined;
};

/**
 * Static, non-interactive rendering of a solved Hashi board, sized for off-platform sharing.
 *
 * Uses the light theme palette so shared images are legible regardless of the
 * user's current in-app theme.
 */
export function HashiShareCard({ puzzle, completion, durationMs }: HashiShareCardProps) {
  const palette = ThemeColor.light;
  const formattedDuration = formatDuration(durationMs);

  const connections = useMemo(() => findConnections(puzzle.islands), [puzzle.islands]);

  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    const fromW = Math.floor(
      (BOARD_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width,
    );
    const fromH = Math.floor(
      (BOARD_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height,
    );
    const cSize = Math.max(24, Math.min(fromW, fromH));
    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const gridHeight = puzzle.height * cSize + CELL_GAP * (puzzle.height - 1);
    return { cellSize: cSize, boardWidth: gridWidth, boardHeight: gridHeight };
  }, [puzzle.width, puzzle.height]);

  const islandPositions = useMemo(
    () =>
      puzzle.islands.map((island) => ({
        x: island.col * (cellSize + CELL_GAP) + cellSize / 2,
        y: island.row * (cellSize + CELL_GAP) + cellSize / 2,
      })),
    [puzzle.islands, cellSize],
  );

  const bridgesByConnectionIndex = useMemo(() => {
    const counts = new Array<number>(connections.length).fill(0);
    completion.bridges.forEach((entry) => {
      const connectionIndex = connections.findIndex((conn) => {
        const a = puzzle.islands[conn.a];
        const b = puzzle.islands[conn.b];
        const matchesForward =
          a.row === entry.from.row &&
          a.col === entry.from.col &&
          b.row === entry.to.row &&
          b.col === entry.to.col;
        const matchesBackward =
          a.row === entry.to.row &&
          a.col === entry.to.col &&
          b.row === entry.from.row &&
          b.col === entry.from.col;
        return matchesForward || matchesBackward;
      });
      if (connectionIndex >= 0) {
        counts[connectionIndex] = entry.bridges;
      }
    });
    return counts;
  }, [completion.bridges, connections, puzzle.islands]);

  const islandRadius = cellSize * ISLAND_RADIUS_RATIO;
  const islandTextSize = cellSize <= 32 ? 'sm' : cellSize <= 48 ? 'md' : 'lg';

  return (
    <View style={[styles.card, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text type="caption" _colorOverride={palette.textSecondary}>
          Hashi
        </Text>
        <Text type="h2" textAlign="center" _colorOverride={palette.text}>
          {puzzle.name}
        </Text>
      </View>

      <View
        style={[
          styles.boardWrap,
          {
            width: boardWidth,
            height: boardHeight,
          },
        ]}
      >
        {connections.map((conn, ci) => {
          const count = bridgesByConnectionIndex[ci];
          if (count <= 0) return null;
          const a = islandPositions[conn.a];
          const b = islandPositions[conn.b];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
          return (
            <View
              key={`bridge-${ci}`}
              style={[
                styles.bridgeContainer,
                {
                  left: a.x,
                  top: a.y - BRIDGE_THICKNESS / 2,
                  width: length,
                  height: BRIDGE_THICKNESS,
                  transformOrigin: 'left center',
                  transform: [{ rotate: `${angleDeg}deg` }],
                },
              ]}
            >
              <View
                style={[
                  styles.bridgeLine,
                  {
                    width: length,
                    height: BRIDGE_THICKNESS,
                    backgroundColor: palette.text,
                    top: count === 2 ? -BRIDGE_OFFSET : 0,
                  },
                ]}
              />
              {count === 2 && (
                <View
                  style={[
                    styles.bridgeLine,
                    {
                      width: length,
                      height: BRIDGE_THICKNESS,
                      backgroundColor: palette.text,
                      top: BRIDGE_OFFSET,
                    },
                  ]}
                />
              )}
            </View>
          );
        })}

        {puzzle.islands.map((island, i) => {
          const pos = islandPositions[i];
          return (
            <View
              key={`island-${i}`}
              style={[
                styles.island,
                {
                  left: pos.x - islandRadius,
                  top: pos.y - islandRadius,
                  width: islandRadius * 2,
                  height: islandRadius * 2,
                  borderRadius: islandRadius,
                  borderWidth: ISLAND_BORDER_WIDTH,
                  borderColor: palette.text,
                  backgroundColor: palette.text,
                },
              ]}
            >
              <Text
                size={islandTextSize}
                fontWeight="semibold"
                _colorOverride={palette.background}
              >
                {island.requiredBridges}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={[styles.divider, { backgroundColor: palette.rule }]} />

      <View style={styles.footer}>
        <Text type="caption" _colorOverride={palette.textSecondary}>
          Solved in
        </Text>
        <Text type="h3" _colorOverride={palette.text}>
          {formattedDuration ?? '—'}
        </Text>
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
  boardWrap: {
    position: 'relative',
  },
  bridgeContainer: {
    position: 'absolute',
    justifyContent: 'center',
  },
  bridgeLine: {
    position: 'absolute',
    left: 0,
    borderRadius: 2,
  },
  island: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
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
