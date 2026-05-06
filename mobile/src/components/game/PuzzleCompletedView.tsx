import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { ShareDailyChallengeButton } from '@/components/game/share/ShareDailyChallengeButton';
import { SharePuzzleCard } from '@/components/game/share/SharePuzzleCard';
import { ShareResultButton } from '@/components/game/share/ShareResultButton';
import { PuzzleCard } from '@/components/PuzzleCard';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/timeUtils';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  FLOW: 'Flow',
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
  SLITHERLINK: 'Slitherlink',
};

type PuzzleCompletedViewProps = {
  puzzle: Puzzle;
  solved: boolean;
  durationMs?: number | null;
  nextPuzzle: Puzzle | null;
};

export function PuzzleCompletedView({
  puzzle,
  solved,
  durationMs,
  nextPuzzle,
}: PuzzleCompletedViewProps) {
  const theme = useTheme();
  const typeLabel = PUZZLE_TYPE_LABELS[puzzle.type];
  const formattedDuration = formatDuration(durationMs);

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

      <Text type="caption" color={solved ? 'success' : 'warning'} textAlign="center">
        {solved ? 'Marked as solved' : 'Marked as attempted'}
      </Text>

      {solved && (
        <View style={styles.shareContainer}>
          <ShareResultButton label="Share result">
            <SharePuzzleCard puzzle={puzzle} durationMs={durationMs} />
          </ShareResultButton>
        </View>
      )}

      {nextPuzzle == null && (
        <View style={styles.shareDailyChallengeButtonContainer}>
          <ShareDailyChallengeButton dailyChallengeId={puzzle.dailyChallenge.id} />
        </View>
      )}

      {nextPuzzle != null && (
        <View style={styles.playNextButtonContainer}>
          <PuzzleCard puzzle={nextPuzzle} variant="small" />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
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
  shareContainer: {
    marginTop: Spacing.two,
  },
  playNextButtonContainer: {
    position: 'absolute',
    bottom: -Spacing.two,
    transform: [{ translateY: '100%' }],
  },
  shareDailyChallengeButtonContainer: {
    position: 'absolute',
    bottom: -Spacing.three,
    transform: [{ translateY: '100%' }],
  },
});
