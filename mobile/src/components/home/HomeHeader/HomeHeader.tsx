import { StyleSheet, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { type DailyChallenge } from '@/api/dailyChallenge/dailyChallengesQuery';
import { Text } from '@/components/common/Text';
import { DailyChallengesList } from '@/components/DailyChallengesList';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

import { INITIAL_ANIMATION_DURATION } from './constants';
import { UserStreak } from './UserStreak';

type HomeHeaderProps = {
  dailyChallenges: DailyChallenge[];
  activeChallengeId: string | null;
  onSelectChallenge: (id: string) => void;
  hasNextPage: boolean;
  onEndReached: () => void;
};

export function HomeHeader({
  dailyChallenges,
  activeChallengeId,
  onSelectChallenge,
  hasNextPage,
  onEndReached,
}: HomeHeaderProps) {
  const theme = useTheme();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Animated.View
            layout={LinearTransition.duration(INITIAL_ANIMATION_DURATION)}
            style={[
              styles.headerTitleBadge,
              {
                backgroundColor: theme.highlightWash,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            <Text type="h2">Game Brain</Text>
          </Animated.View>
          <UserStreak />
        </View>
      </View>
      <DailyChallengesList
        dailyChallenges={dailyChallenges}
        activeChallengeId={activeChallengeId}
        onSelectChallenge={onSelectChallenge}
        hasNextPage={hasNextPage}
        onEndReached={onEndReached}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.half,
    paddingBottom: Spacing.two,
  },
  headerTitleBadge: {
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    flex: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
