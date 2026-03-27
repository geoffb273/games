import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { PuzzleIcon } from '@/components/common/PuzzleIcon';
import { Text } from '@/components/common/Text';
import { type ThemeColor } from '@/constants/theme';
import { Radii, Spacing } from '@/constants/token';
import { usePuzzlePalette } from '@/hooks/usePuzzlePalette';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';

import { ErrorView } from './common/ErrorView';

const PUZZLE_TYPE_DESCRIPTIONS: Record<Puzzle['type'], string> = {
  FLOW: 'Connect matching colors without crossing paths.',
  HANJI: 'Fill the grid to reveal a hidden picture.',
  HASHI: 'Draw bridges to connect all the islands.',
  MINESWEEPER: 'Clear the board without detonating any mines.',
  SLITHERLINK: 'Draw a single loop that satisfies all the clues.',
};

type PuzzleCardProps = {
  puzzle: Puzzle;
  variant?: 'normal' | 'small';
};

export function PuzzleCard({ puzzle, variant = 'normal' }: PuzzleCardProps) {
  const theme = useTheme();
  const isCompleted = puzzle.attempt != null;
  const isSolved = isCompleted && puzzle.attempt?.completedAt != null;
  const palette = usePuzzlePalette(puzzle.type);
  const router = useRouter();

  const isNormalVariant = variant === 'normal';
  const isSmallVariant = variant === 'small';

  // Pre-load the puzzle to avoid flickering
  usePuzzleQuery({ id: puzzle.id });

  const description = isSmallVariant
    ? null
    : (puzzle.description ?? PUZZLE_TYPE_DESCRIPTIONS[puzzle.type]);

  return (
    <Pressable
      onPress={() => {
        if (isNormalVariant) {
          router.push({ pathname: '/game/[id]', params: { id: puzzle.id } });
        } else {
          router.replace({ pathname: '/game/[id]', params: { id: puzzle.id } });
        }
      }}
      style={({ pressed }) => [
        styles.puzzleCard,
        isNormalVariant && styles.normalVariant,
        isSmallVariant && styles.smallVariant,
        {
          backgroundColor: pressed ? getColorWithOpacity(palette.chip, 0.5) : palette.card,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <View
        style={[
          styles.puzzleCardContent,
          isNormalVariant && styles.normalVariantCardContent,
          isSmallVariant && styles.smallVariantCardContent,
        ]}
      >
        <PuzzleIcon type={puzzle.type} size={isSmallVariant ? 'sm' : 'md'} />
        <View
          style={[
            styles.puzzleInfo,
            isNormalVariant && styles.normalVariantContent,
            isSmallVariant && styles.smallVariantContent,
          ]}
        >
          <Text type={isSmallVariant ? 'lead' : 'h3'} numberOfLines={1}>
            {isSmallVariant ? 'Play ' : ''}
            {puzzle.name}
          </Text>

          {description != null && (
            <Text type="caption" color="textSecondary" numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        {isNormalVariant && (
          <PuzzleStatusIcon status={isSolved ? 'solved' : isCompleted ? 'lost' : 'incomplete'} />
        )}
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
  error,
}: {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  error?: unknown;
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : isError ? (
        <ErrorView title="Unable to load puzzles" message={null} onRetry={onRetry} error={error} />
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
    borderRadius: Radii.md,
    padding: Spacing.three,
    borderWidth: 1,
    marginHorizontal: Spacing.one,
    marginVertical: Spacing.one,
  },
  smallVariant: {},
  normalVariant: {
    flex: 1,
  },
  puzzleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallVariantCardContent: {
    gap: Spacing.two,
  },
  normalVariantCardContent: {
    gap: Spacing.three,
  },
  puzzleInfo: {
    gap: Spacing.one,
  },
  smallVariantContent: {},
  normalVariantContent: { flex: 1 },
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
