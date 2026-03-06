import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
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
        <ErrorView message="Unable to load daily challenges" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text type="h2">Puzzle Book</Text>
          <Text type="caption" color="textSecondary">
            Pick a day, then work through each puzzle page.
          </Text>
        </View>
        <DailyChallengesList
          dailyChallenges={dailyChallenges}
          activeChallengeId={activeChallengeId}
          onSelectChallenge={handleSelectChallenge}
          hasNextPage={hasNextPage}
          onEndReached={fetchMore}
        />
        <PuzzleList puzzles={puzzles} isLoading={isPuzzlesLoading} isError={isPuzzlesError} />
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
  header: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.half,
    paddingBottom: Spacing.two,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
