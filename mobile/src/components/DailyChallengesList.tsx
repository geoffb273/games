import { memo, useCallback } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { type DailyChallenge as DailyChallengeType } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { Text } from '@/components/common/Text';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';
import { getColorWithOpacity } from '@/utils/colorUtils';

function formatDate(date: Date): string {
  const d = new Date(date);

  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  });
}

function isChallengeFullyComplete(challenge: DailyChallengeType): boolean {
  return challenge.puzzleCount > 0 && challenge.completedPuzzleCount >= challenge.puzzleCount;
}

type DailyChallengesListProps = {
  dailyChallenges: DailyChallengeType[];
  activeChallengeId: string | null;
  onSelectChallenge: (id: string) => void;
  hasNextPage: boolean;
  onEndReached: () => void;
};

const EDGE_GRADIENT_WIDTH = 24;

export function DailyChallengesList({
  dailyChallenges,
  activeChallengeId,
  onSelectChallenge,
  hasNextPage,
  onEndReached,
}: DailyChallengesListProps) {
  const theme = useTheme();

  const renderItem = useCallback(
    ({ item: challenge }: { item: DailyChallengeType }) => (
      <DailyChallenge
        challenge={challenge}
        isSelected={challenge.id === activeChallengeId}
        onPress={onSelectChallenge}
      />
    ),
    [activeChallengeId, onSelectChallenge],
  );

  return (
    <View style={styles.wrapper}>
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
      <LinearGradient
        colors={[theme.background, getColorWithOpacity(theme.background, 0)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edgeGradient, styles.edgeGradientLeft]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[getColorWithOpacity(theme.background, 0), theme.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.edgeGradient, styles.edgeGradientRight]}
        pointerEvents="none"
      />
    </View>
  );
}

type DailyChallengeProps = {
  challenge: DailyChallengeType;
  isSelected: boolean;
  onPress: (id: string) => void;
};

const DailyChallenge = memo(function DailyChallenge({
  challenge,
  isSelected,
  onPress,
}: DailyChallengeProps) {
  const theme = useTheme();
  const fullyComplete = isChallengeFullyComplete(challenge);

  // Prefetch puzzles for the daily challenge
  usePuzzlesQuery({ dailyChallengeId: challenge.id });

  const backgroundColor = fullyComplete
    ? theme.successSurface
    : isSelected
      ? theme.highlightWash
      : theme.background;

  const borderColor = isSelected
    ? theme.accentInk
    : fullyComplete
      ? theme.success
      : theme.borderSubtle;

  return (
    <Pressable
      onPress={() => onPress(challenge.id)}
      style={[
        styles.challengeChip,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={styles.challengeChipRow}>
        <View style={styles.challengeChipText}>
          <Text type="body">{formatDate(challenge.date)}</Text>
          <Text type="caption" color={fullyComplete ? 'success' : 'textSecondary'}>
            {fullyComplete
              ? 'Complete'
              : `${challenge.completedPuzzleCount}/${challenge.puzzleCount} complete`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  list: {
    flexGrow: 0,
  },
  edgeGradient: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: EDGE_GRADIENT_WIDTH,
  },
  edgeGradientLeft: {
    left: 0,
  },
  edgeGradientRight: {
    right: 0,
  },
  container: {
    gap: Spacing.one,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  challengeChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radii.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  challengeChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  challengeChipText: {
    alignItems: 'center',
  },
});
