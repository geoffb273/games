import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
};

type PuzzleListProps = {
  puzzles: Puzzle[];
};

export function PuzzleList({ puzzles }: PuzzleListProps) {
  return (
    <FlatList
      data={puzzles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.puzzleList}
      renderItem={({ item }) => <PuzzleCard puzzle={item} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text type="body" color="textSecondary" textAlign="center">
            No puzzles available
          </Text>
        </View>
      }
    />
  );
}

function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  const theme = useTheme();
  const isCompleted = puzzle.attempt?.completedAt != null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: puzzle.id } })}
      style={({ pressed }) => [
        styles.puzzleCard,
        {
          backgroundColor: theme.backgroundElement,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.puzzleCardContent}>
        <View style={styles.puzzleInfo}>
          <Text type="emphasized_body">{puzzle.name}</Text>
          <View style={styles.puzzleMeta}>
            <View style={[styles.typeBadge, { backgroundColor: theme.backgroundSelected }]}>
              <Text type="caption">{PUZZLE_TYPE_LABELS[puzzle.type]}</Text>
            </View>
            {puzzle.description && (
              <Text type="caption" color="textSecondary" numberOfLines={1}>
                {puzzle.description}
              </Text>
            )}
          </View>
        </View>
        {isCompleted && (
          <View style={styles.completedBadge}>
            <Text type="caption" _colorOverride="#34C759">
              Done
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puzzleList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
  puzzleCard: {
    borderRadius: 14,
    padding: Spacing.three,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  puzzleInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  puzzleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 6,
  },
  completedBadge: {
    marginLeft: Spacing.two,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
