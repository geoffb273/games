import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { PuzzleCard } from '@/components/PuzzleCard';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';
import { formatDuration } from '@/utils/timeUtils';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  FLOW: 'Flow',
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
  SLITHERLINK: 'Slitherlink',
};

const SPEED_PERCENTILE_CAPTION =
  'Faster than this share of other players\u2019 times on this puzzle';

type PuzzleCompletedViewProps = {
  puzzleType: Puzzle['type'];
  solved: boolean;
  durationMs?: number | null;
  /** Share of other players’ times that were slower or tied; omit when unknown. */
  speedPercent?: number | null;
  nextPuzzle: Puzzle | null;
};

export function PuzzleCompletedView({
  puzzleType,
  solved,
  durationMs,
  speedPercent,
  nextPuzzle,
}: PuzzleCompletedViewProps) {
  const theme = useTheme();
  const typeLabel = PUZZLE_TYPE_LABELS[puzzleType];

  const formattedDuration = formatDuration(durationMs);

  const showSpeedPercentile =
    solved && durationMs != null && formattedDuration != null && typeof speedPercent === 'number';

  return (
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
        {solved ? 'Chapter Complete' : 'Chapter Failed'}
      </Text>

      <View style={[styles.rule, { backgroundColor: theme.rule }]} />

      <Text type="lead" textAlign="center">
        {solved
          ? formattedDuration
            ? `Completed in ${formattedDuration}.`
            : 'A thoughtful finish to this puzzle.'
          : `Better luck next time. Try again with tomorrow's puzzle.`}
      </Text>

      {showSpeedPercentile && <SpeedPercentileSection speedPercent={speedPercent} />}

      <Text type="caption" color={solved ? 'success' : 'warning'} textAlign="center">
        {solved ? 'Marked as solved' : 'Marked as attempted'}
      </Text>
      {nextPuzzle != null && (
        <Animated.View style={styles.playNextButtonContainer}>
          <PuzzleCard puzzle={nextPuzzle} variant="small" />
        </Animated.View>
      )}
    </Animated.View>
  );
}

function SpeedPercentileSection({ speedPercent }: { speedPercent: number }) {
  const theme = useTheme();
  const progress = useSharedValue(0);

  useEffect(() => {
    const clamped = Math.min(100, Math.max(0, speedPercent));
    progress.value = withTiming(clamped / 100, { duration: 520 });
  }, [speedPercent, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const rounded = Math.round(speedPercent);

  return (
    <View style={styles.speedSection}>
      <Text type="h3" textAlign="center">
        {rounded}%
      </Text>
      <Text type="caption" color="textSecondary" textAlign="center">
        {SPEED_PERCENTILE_CAPTION}
      </Text>
      <View
        style={[styles.meterTrack, { backgroundColor: getColorWithOpacity(theme.accentInk, 0.15) }]}
      >
        <Animated.View style={[styles.meterFill, { backgroundColor: theme.success }, fillStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  speedSection: {
    width: '100%',
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  meterTrack: {
    width: '100%',
    height: 6,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: Radii.pill,
  },
  playNextButtonContainer: {
    position: 'absolute',
    bottom: -Spacing.two,
    transform: [{ translateY: '100%' }],
  },
});
