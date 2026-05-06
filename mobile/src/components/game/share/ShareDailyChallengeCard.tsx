import { StyleSheet, View } from 'react-native';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { PuzzleIcon } from '@/components/common/PuzzleIcon';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { usePuzzlePalette } from '@/hooks/usePuzzlePalette';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/timeUtils';

import { SHARE_ASSET_CONTENT_TARGET_SIZE, ShareAssetCard } from './ShareAssetCard';

type ShareDailyChallengeCardProps = {
  puzzles: Puzzle[];
};

export function ShareDailyChallengeCard({ puzzles }: ShareDailyChallengeCardProps) {
  const firstPuzzle = puzzles[0];

  return (
    <ShareAssetCard
      title="Daily Challenge"
      dailyChallengeDate={firstPuzzle?.dailyChallenge.date}
      durationMs={null}
    >
      <View style={styles.rows}>
        {puzzles.map((puzzle) => (
          <ShareDailyChallengePuzzleRow key={puzzle.id} puzzle={puzzle} />
        ))}
      </View>
    </ShareAssetCard>
  );
}

type ShareDailyChallengePuzzleRowProps = {
  puzzle: Puzzle;
};

function ShareDailyChallengePuzzleRow({ puzzle }: ShareDailyChallengePuzzleRowProps) {
  const theme = useTheme();
  const palette = usePuzzlePalette(puzzle.type);
  const formattedDuration = formatDuration(puzzle.attempt?.durationMs);
  const isSolved = puzzle.attempt?.completedAt != null;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: palette.card,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <View style={styles.rowInner}>
        <PuzzleIcon type={puzzle.type} size="sm" />
        <View style={styles.puzzleInfo}>
          <Text type="lead" numberOfLines={1}>
            {puzzle.name}
          </Text>
        </View>
        <Text type="emphasized_body" color={isSolved ? 'success' : 'warning'} textAlign="right">
          {isSolved ? (formattedDuration ?? 'Solved') : 'Failed'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.two,
  },
  row: {
    width: SHARE_ASSET_CONTENT_TARGET_SIZE,
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.three,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  puzzleInfo: {
    flex: 1,
    gap: Spacing.one,
  },
});
