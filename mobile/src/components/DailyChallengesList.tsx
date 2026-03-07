import { useCallback } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { type DailyChallenge as DailyChallengeType } from '@/api/dailyChallenge/dailyChallengesQuery';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

type DailyChallengesListProps = {
  dailyChallenges: DailyChallengeType[];
  activeChallengeId: string | null;
  onSelectChallenge: (id: string) => void;
  hasNextPage: boolean;
  onEndReached: () => void;
};

export function DailyChallengesList({
  dailyChallenges,
  activeChallengeId,
  onSelectChallenge,
  hasNextPage,
  onEndReached,
}: DailyChallengesListProps) {
  const renderItem = useCallback(
    ({ item: challenge }: { item: DailyChallengeType }) => (
      <DailyChallenge
        challenge={challenge}
        isSelected={challenge.id === activeChallengeId}
        onPress={() => onSelectChallenge(challenge.id)}
      />
    ),
    [activeChallengeId, onSelectChallenge],
  );

  return (
    <FlatList
      horizontal
      style={styles.list}
      inverted
      data={dailyChallenges}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      onEndReached={hasNextPage ? onEndReached : undefined}
      onEndReachedThreshold={0.5}
    />
  );
}

type DailyChallengeProps = {
  challenge: DailyChallengeType;
  isSelected: boolean;
  onPress: () => void;
};

function DailyChallenge({ challenge, isSelected, onPress }: DailyChallengeProps) {
  const theme = useTheme();
  const isComplete = challenge.completedPuzzleCount === challenge.puzzleCount;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.challengeChip,
        {
          backgroundColor: isSelected ? theme.highlightWash : theme.background,
          borderColor: isSelected ? theme.accentInk : theme.borderSubtle,
        },
      ]}
    >
      <Text type="body">{formatDate(challenge.date)}</Text>
      <Text type="caption" color="textSecondary">
        {isComplete
          ? `All ${challenge.puzzleCount} puzzles complete`
          : `${challenge.completedPuzzleCount}/${challenge.puzzleCount} complete`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 0,
  },
  container: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
  },
  challengeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 130,
  },
});
