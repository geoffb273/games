import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { ErrorView } from './common/ErrorView';

const PUZZLE_TYPE_ICONS: Record<Puzzle['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  HANJI: 'grid-large',
  HASHI: 'bridge',
  MINESWEEPER: 'bomb',
};

export function PuzzleListEmptyState({
  isLoading,
  isError,
}: {
  isLoading?: boolean;
  isError?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : isError ? (
        <ErrorView title="Unable to load puzzles" message={null} />
      ) : (
        <Text type="body" color="textSecondary" textAlign="center">
          No puzzles available
        </Text>
      )}
    </View>
  );
}

export function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  const theme = useTheme();
  const isCompleted = puzzle.attempt != null;
  const isSolved = isCompleted && puzzle.attempt?.completedAt != null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: puzzle.id } })}
      style={({ pressed }) => [
        styles.puzzleCard,
        {
          backgroundColor: pressed ? theme.highlightWash : theme.backgroundElement,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <View style={styles.puzzleCardContent}>
        <View style={styles.puzzleLeading}>
          <MaterialCommunityIcons
            name={PUZZLE_TYPE_ICONS[puzzle.type]}
            size={22}
            color={theme.accentInk}
          />
        </View>
        <View style={styles.puzzleInfo}>
          <Text type="h3" numberOfLines={1}>
            {puzzle.name}
          </Text>
          {puzzle.description && (
            <Text type="caption" color="textSecondary" numberOfLines={2}>
              {puzzle.description}
            </Text>
          )}
        </View>
        {isCompleted && (
          <View
            style={[
              styles.completedBadge,
              {
                borderColor: isSolved ? theme.success : theme.warning,
                backgroundColor: isSolved ? theme.successSurface : theme.warningSurface,
              },
            ]}
          >
            <Text type="caption" color={isSolved ? 'success' : 'warning'}>
              {isSolved ? 'Solved' : 'Attempted'}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puzzleCard: {
    borderRadius: Radii.md,
    padding: Spacing.three,
    borderWidth: 1,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  puzzleLeading: {
    width: 34,
    height: 34,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  puzzleInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  completedBadge: {
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
