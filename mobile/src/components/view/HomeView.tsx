import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { Text } from '@/components/common/Text';
import { DailyChallengesList } from '@/components/DailyChallengesList';
import { FlatListLayout } from '@/components/layout/FlatListLayout';
import { PuzzleCard, PuzzleListEmptyState } from '@/components/PuzzleCard';
import { Radii, Spacing } from '@/constants/token';
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
    <FlatListLayout
      header={
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <View
              style={[
                styles.headerTitleBadge,
                {
                  backgroundColor: theme.highlightWash,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Text type="h2">Game Brain</Text>
            </View>
          </View>
          <DailyChallengesList
            dailyChallenges={dailyChallenges}
            activeChallengeId={activeChallengeId}
            onSelectChallenge={handleSelectChallenge}
            hasNextPage={hasNextPage}
            onEndReached={fetchMore}
          />
        </View>
      }
      data={puzzles ?? []}
      renderItem={({ item }) => <PuzzleCard puzzle={item} />}
      contentContainerStyle={styles.puzzleList}
      edges={['top']}
      ListEmptyComponent={
        <PuzzleListEmptyState
          isLoading={isPuzzlesLoading}
          isError={isPuzzlesError}
          onRetry={refetchPuzzles}
          error={errorPuzzles}
        />
      }
    />
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
  },
  puzzleList: {
    paddingHorizontal: Spacing.three,
    rowGap: Spacing.one,
    paddingBottom: Spacing.five,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
