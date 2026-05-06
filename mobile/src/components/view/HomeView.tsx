import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { HomeHeader } from '@/components/home/HomeHeader/HomeHeader';
import { ScrollViewLayout } from '@/components/layout/ScrollViewLayout';
import { PuzzleList } from '@/components/PuzzleList';
import { Spacing } from '@/constants/token';
import { useTheme } from '@/hooks/useTheme';

export function HomeView() {
  const theme = useTheme();
  const {
    dailyChallenges,
    isLoading: isChallengesLoading,
    isError: isChallengesError,
    error: errorChallenges,
    fetchMore,
    hasNextPage,
    refetch: refetchChallenges,
  } = useDailyChallengesQuery();

  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  const handleSelectChallenge = useCallback((id: string) => setSelectedChallengeId(id), []);

  const activeChallengeId = selectedChallengeId ?? dailyChallenges[0]?.id ?? null;

  const {
    puzzles,
    isLoading: isPuzzlesLoading,
    isError: isPuzzlesError,
    error: errorPuzzles,
    refetch: refetchPuzzles,
  } = usePuzzlesQuery({ dailyChallengeId: activeChallengeId });

  if (isChallengesError && !isChallengesLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ErrorView
          message="Unable to load daily challenges"
          onRetry={refetchChallenges}
          error={errorChallenges}
        />
      </View>
    );
  }

  return (
    <ScrollViewLayout
      header={
        <HomeHeader
          dailyChallenges={dailyChallenges}
          activeChallengeId={activeChallengeId}
          onSelectChallenge={handleSelectChallenge}
          hasNextPage={hasNextPage}
          onEndReached={fetchMore}
        />
      }
      edges={['top']}
    >
      <PuzzleList
        dailyChallengeId={activeChallengeId}
        puzzles={puzzles ?? []}
        isLoading={isPuzzlesLoading}
        isError={isPuzzlesError}
        onRetry={refetchPuzzles}
        error={errorPuzzles}
      />
    </ScrollViewLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
