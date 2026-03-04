import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { Text } from '@/components/common/Text';
import { DailyChallengesList } from '@/components/DailyChallengesList';
import { PuzzleList } from '@/components/PuzzleList';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const theme = useTheme();
  const {
    dailyChallenges,
    isLoading: isChallengesLoading,
    isError: isChallengesError,
    fetchMore,
    hasNextPage,
  } = useDailyChallengesQuery();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const handleSelectChallenge = useCallback((id: string) => setSelectedChallengeId(id), []);

  const activeChallengeId = selectedChallengeId ?? dailyChallenges[0]?.id ?? null;

  const {
    puzzles,
    isLoading: isPuzzlesLoading,
    isError: isPuzzlesError,
  } = usePuzzlesQuery({ dailyChallengeId: activeChallengeId });

  if (isChallengesLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  if (isChallengesError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text type="h3" textAlign="center">
          Something went wrong
        </Text>
        <Text type="body" color="textSecondary" textAlign="center">
          Unable to load daily challenges
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text type="h2">Daily Challenges</Text>
        </View>

        <DailyChallengesList
          dailyChallenges={dailyChallenges}
          activeChallengeId={activeChallengeId}
          onSelectChallenge={handleSelectChallenge}
          hasNextPage={hasNextPage}
          onEndReached={fetchMore}
        />

        {isPuzzlesLoading ? (
          <View style={styles.puzzlesLoading}>
            <ActivityIndicator size="small" color={theme.text} />
          </View>
        ) : isPuzzlesError || puzzles == null ? (
          <View style={styles.puzzlesLoading}>
            <Text type="body" color="textSecondary" textAlign="center">
              Unable to load puzzles
            </Text>
          </View>
        ) : (
          <PuzzleList puzzles={puzzles} />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  puzzlesLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
});
