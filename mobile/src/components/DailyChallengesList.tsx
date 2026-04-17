import { memo, useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const lockedChallenge = useMemo<DailyChallengeType | null>(() => {
    const latestChallenge = dailyChallenges[0];
    if (!latestChallenge) return null;

    const nextDate = new Date(latestChallenge.date);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);

    return {
      id: 'locked-next',
      date: nextDate,
      completedPuzzleCount: 0,
      puzzleCount: 0,
    };
  }, [dailyChallenges]);

  const renderItem = useCallback(
    ({ item: challenge }: { item: DailyChallengeType }) => (
      <DailyChallenge
        challenge={challenge}
        type="normal"
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
        ListHeaderComponent={
          lockedChallenge ? <DailyChallenge challenge={lockedChallenge} type="locked" /> : null
        }
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

type BaseDailyChallengeProps = {
  challenge: DailyChallengeType;
};

type DailyChallengeProps = BaseDailyChallengeProps &
  (
    | {
        isSelected: boolean;
        onPress: (id: string) => void;
        type: 'normal';
      }
    | { isSelected?: never; onPress?: never; type: 'locked' }
  );

const DailyChallenge = memo(function DailyChallenge({
  challenge,
  isSelected,
  onPress,
  type,
}: DailyChallengeProps) {
  const theme = useTheme();
  const isNormal = type === 'normal';

  // Prefetch puzzles for the daily challenge
  usePuzzlesQuery({ dailyChallengeId: challenge.id, enabled: isNormal });

  return (
    <Pressable
      disabled={!isNormal}
      onPress={() => isNormal && onPress(challenge.id)}
      style={[
        styles.challengeChip,
        {
          backgroundColor: isNormal && isSelected ? theme.highlightWash : theme.background,
          borderColor: isNormal && isSelected ? theme.accentInk : theme.borderSubtle,
        },
        !isNormal && styles.lockedChip,
      ]}
    >
      <Text type="body">{formatDate(challenge.date)}</Text>
      {isNormal && (
        <Text type="caption" color="textSecondary">
          {`${challenge.completedPuzzleCount}/${challenge.puzzleCount} complete`}
        </Text>
      )}
      {type === 'locked' && (
        <MaterialCommunityIcons name="lock" size={14} color={theme.textSecondary} />
      )}
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
  lockedChip: {
    gap: Spacing.one,
    opacity: 0.7,
  },
});
