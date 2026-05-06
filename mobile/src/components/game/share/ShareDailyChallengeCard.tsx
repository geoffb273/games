import { StyleSheet, View } from 'react-native';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { formatDuration } from '@/utils/timeUtils';

import { ShareAssetCard } from './ShareAssetCard';

const PUZZLE_TYPE_LABELS: Record<Puzzle['type'], string> = {
  FLOW: 'Flow',
  HANJI: 'Hanji',
  HASHI: 'Hashi',
  MINESWEEPER: 'Minesweeper',
  SLITHERLINK: 'Slitherlink',
};

type ShareDailyChallengeCardProps = {
  puzzles: Puzzle[];
};

export function ShareDailyChallengeCard({ puzzles }: ShareDailyChallengeCardProps) {
  const theme = useTheme();
  const firstPuzzle = puzzles[0];
  const solvedCount = puzzles.filter((puzzle) => puzzle.attempt?.completedAt != null).length;
  const failedCount = puzzles.length - solvedCount;

  return (
    <ShareAssetCard
      title="Daily Challenge"
      dailyChallengeDate={firstPuzzle?.dailyChallenge.date}
      durationMs={null}
    >
      <View style={styles.container}>
        <View style={styles.summary}>
          <Text type="h2" textAlign="center">
            {solvedCount}/{puzzles.length} solved
          </Text>
          {failedCount > 0 && (
            <Text type="caption" color="warning" textAlign="center">
              {failedCount} failed attempt{failedCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>

        <View style={styles.rows}>
          {puzzles.map((puzzle) => {
            const formattedDuration = formatDuration(puzzle.attempt?.durationMs);
            const isSolved = puzzle.attempt?.completedAt != null;

            return (
              <View
                key={puzzle.id}
                style={[
                  styles.row,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.borderSubtle,
                  },
                ]}
              >
                <View style={styles.puzzleMeta}>
                  <Text type="caption" color="textSecondary">
                    {PUZZLE_TYPE_LABELS[puzzle.type]}
                  </Text>
                  <Text type="emphasized_body" numberOfLines={1}>
                    {puzzle.name}
                  </Text>
                </View>
                <Text
                  type="emphasized_body"
                  color={isSolved ? 'success' : 'warning'}
                  textAlign="right"
                >
                  {isSolved ? (formattedDuration ?? 'Solved') : 'Failed'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </ShareAssetCard>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    gap: Spacing.three,
    width: '100%',
  },
  summary: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  rows: {
    gap: Spacing.two,
    width: '100%',
  },
  row: {
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.three,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  puzzleMeta: {
    flex: 1,
    gap: Spacing.half,
  },
});
