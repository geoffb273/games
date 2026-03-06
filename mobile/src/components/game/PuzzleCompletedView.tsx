import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
};

type PuzzleCompletedViewProps = {
  puzzleType: Puzzle['type'];
  solved: boolean;
  durationMs?: number | null;
};

export function PuzzleCompletedView({ puzzleType, solved, durationMs }: PuzzleCompletedViewProps) {
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
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <View style={styles.typeBadge}>
          <Text type="caption" color="textSecondary">
            {typeLabel}
          </Text>
        </View>

        <Text type="h2" textAlign="center">
          {solved ? 'Chapter Complete' : 'Chapter Paused'}
        </Text>

        <View style={[styles.rule, { backgroundColor: theme.rule }]} />

        <Text type="lead" textAlign="center">
          {solved
            ? formattedDuration
              ? `Completed in ${formattedDuration}.`
              : 'A thoughtful finish to this puzzle.'
            : 'Take another pass when you are ready.'}
        </Text>

        <Text type="caption" color={solved ? 'success' : 'warning'} textAlign="center">
          {solved ? 'Marked as solved' : 'Marked as attempted'}
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
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.five,
    borderRadius: Radii.lg,
    borderWidth: 1,
    maxWidth: 360,
    gap: Spacing.two,
  },
  typeBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
  },
  rule: {
    width: '100%',
    height: 1,
    marginVertical: Spacing.one,
  },
});
