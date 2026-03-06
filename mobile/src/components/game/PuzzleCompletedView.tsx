import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
};

type PuzzleCompletedViewProps = {
  puzzleType: Puzzle['type'];
  puzzleName?: string;
  solved: boolean;
  durationMs?: number | null;
};

export function PuzzleCompletedView({
  puzzleType,
  puzzleName,
  solved,
  durationMs,
}: PuzzleCompletedViewProps) {
  const theme = useTheme();
  const typeLabel = PUZZLE_TYPE_LABELS[puzzleType];

  const formattedDuration =
    durationMs != null && durationMs > 0 ? `${Math.round(durationMs / 1000)}s` : null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={[
          styles.card,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: solved ? '#34C759' : theme.backgroundSelected,
          },
        ]}
      >
        <View style={styles.iconRow}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: solved ? 'rgba(52, 199, 89, 0.2)' : 'rgba(255, 149, 0, 0.2)',
              },
            ]}
          >
            <Text type="h1" _colorOverride={solved ? '#34C759' : '#FF9500'}>
              {solved ? '✓' : '✕'}
            </Text>
          </View>
        </View>

        {puzzleName && (
          <Text type="caption" color="textSecondary" textAlign="center">
            {puzzleName}
          </Text>
        )}

        <View style={styles.typeBadge}>
          <Text type="caption" color="textSecondary">
            {typeLabel}
          </Text>
        </View>

        <Text type="h2" textAlign="center">
          {solved ? 'You solved it!' : 'Better luck next time'}
        </Text>

        <Text type="body" color="textSecondary" textAlign="center">
          {solved
            ? formattedDuration
              ? `Completed in ${formattedDuration}`
              : 'Great work on this puzzle.'
            : 'Give it another try when you’re ready.'}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.five,
    borderRadius: 20,
    borderWidth: 2,
    maxWidth: 320,
    gap: Spacing.two,
  },
  iconRow: {
    marginBottom: Spacing.two,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
});
