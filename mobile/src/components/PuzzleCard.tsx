import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { Text } from '@/components/common/Text';
import { getPuzzlePalette } from '@/constants/puzzleThemeConstants';
import { Radii, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import { ErrorView } from './common/ErrorView';

const PUZZLE_TYPE_ICONS: Record<Puzzle['type'], keyof typeof MaterialCommunityIcons.glyphMap> = {
  FLOW: 'chart-bubble',
  HANJI: 'grid-large',
  HASHI: 'bridge',
  MINESWEEPER: 'bomb',
  SLITHERLINK: 'vector-polyline',
};

const PUZZLE_TYPE_DESCRIPTIONS: Record<Puzzle['type'], string> = {
  FLOW: 'Connect matching colors without crossing paths.',
  HANJI: 'Fill the grid to reveal a hidden picture.',
  HASHI: 'Draw bridges to connect all the islands.',
  MINESWEEPER: 'Clear the board without detonating any mines.',
  SLITHERLINK: 'Draw a single loop that satisfies all the clues.',
};

export function PuzzleCard({ puzzle }: { puzzle: Puzzle }) {
  const theme = useTheme();
  const isCompleted = puzzle.attempt != null;
  const isSolved = isCompleted && puzzle.attempt?.completedAt != null;
  const palette = getPuzzlePalette(puzzle.type, theme.background);

  // Pre-load the puzzle to avoid flickering
  usePuzzleQuery({ id: puzzle.id });

  const description = puzzle.description ?? PUZZLE_TYPE_DESCRIPTIONS[puzzle.type];

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/game/[id]', params: { id: puzzle.id } })}
      style={({ pressed }) => [
        styles.puzzleCard,
        {
          backgroundColor: pressed ? palette.chip : palette.card,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <View style={styles.puzzleCardContent}>
        <View style={[styles.puzzleLeading, { backgroundColor: palette.chip }]}>
          <MaterialCommunityIcons
            name={PUZZLE_TYPE_ICONS[puzzle.type]}
            size={28}
            color={theme.accentInk}
          />
        </View>
        <View style={styles.puzzleInfo}>
          <Text type="h3" numberOfLines={1}>
            {puzzle.name}
          </Text>

          {description && (
            <Text type="caption" color="textSecondary" numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        <PuzzleStatusIcon status={isSolved ? 'solved' : isCompleted ? 'lost' : 'incomplete'} />
      </View>
    </Pressable>
  );
}

type PuzzleStatus = 'solved' | 'lost' | 'incomplete';

const PUZZLE_STATUS_ICONS: Record<
  PuzzleStatus,
  {
    icon: keyof typeof MaterialCommunityIcons.glyphMap | null;
    borderColor: ThemeColor;
    backgroundColor: ThemeColor;
  }
> = {
  solved: { icon: 'check', borderColor: 'success', backgroundColor: 'successSurface' },
  lost: { icon: 'close', borderColor: 'error', backgroundColor: 'errorSurface' },
  incomplete: { icon: null, borderColor: 'accentInk', backgroundColor: 'highlightWash' },
};

function PuzzleStatusIcon({ status }: { status: PuzzleStatus }) {
  const theme = useTheme();
  const { icon, borderColor, backgroundColor } = PUZZLE_STATUS_ICONS[status];

  return (
    <View
      style={[
        styles.completedBadge,
        {
          borderColor: theme[borderColor],
          backgroundColor: theme[backgroundColor],
        },
      ]}
    >
      {icon != null && <MaterialCommunityIcons name={icon} size={16} color={theme[borderColor]} />}
    </View>
  );
}

export function PuzzleListEmptyState({
  isLoading,
  isError,
  onRetry,
}: {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : isError ? (
        <ErrorView title="Unable to load puzzles" message={null} onRetry={onRetry} />
      ) : (
        <Text type="body" color="textSecondary" textAlign="center">
          No puzzles available
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  puzzleCard: {
    flex: 1,
    borderRadius: Radii.md,
    padding: Spacing.three,
    borderWidth: 1,
    marginHorizontal: Spacing.one,
    marginVertical: Spacing.one,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  puzzleLeading: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: Spacing.half,
  },
  puzzleInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  completedBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.pill,
    height: 20,
    width: 20,
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
