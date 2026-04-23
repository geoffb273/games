import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { type DailyChallenge } from '@/api/dailyChallenge/dailyChallengesQuery';
import { useUserStreakQuery } from '@/api/user/userStreakQuery';
import { Text } from '@/components/common/Text';
import { DailyChallengesList } from '@/components/DailyChallengesList';
import { Radii, Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

type HomeHeaderProps = {
  dailyChallenges: DailyChallenge[];
  activeChallengeId: string | null;
  onSelectChallenge: (id: string) => void;
  hasNextPage: boolean;
  onEndReached: () => void;
};

const ANIMATION_DURATION = 300;

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
            layout={LinearTransition.duration(ANIMATION_DURATION)}
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

function UserStreak() {
  const theme = useTheme();
  const { streak, isLoading } = useUserStreakQuery();

  const currentStreak = streak?.current ?? 0;

  if (isLoading || currentStreak === 0) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeIn.duration(ANIMATION_DURATION).delay(ANIMATION_DURATION)}
      style={[
        styles.streakBadge,
        {
          backgroundColor: theme.warningSurface,
          borderColor: theme.borderSubtle,
        },
      ]}
    >
      <MaterialCommunityIcons name="fire" size={18} color={theme.warning} />
      <Text type="emphasized_body" _colorOverride={theme.warning}>
        {currentStreak}
      </Text>
    </Animated.View>
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
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    height: '100%',
  },
});
