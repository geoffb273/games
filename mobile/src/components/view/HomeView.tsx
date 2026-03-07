import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { Text } from '@/components/common/Text';
import { DailyChallengesList } from '@/components/DailyChallengesList';
import { FlatListLayout } from '@/components/layout/FlatListLayout';
import { PuzzleCard, PuzzleListEmptyState } from '@/components/PuzzleCard';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function HomeView() {
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

  if (isChallengesError && !isChallengesLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <ErrorView message="Unable to load daily challenges" />
      </View>
    );
  }

  return (
    <FlatListLayout
      header={
        <>
          <View style={styles.header}>
            <Text type="h2">Puzzle Book</Text>
          </View>
          <DailyChallengesList
            dailyChallenges={dailyChallenges}
            activeChallengeId={activeChallengeId}
            onSelectChallenge={handleSelectChallenge}
            hasNextPage={hasNextPage}
            onEndReached={fetchMore}
          />
        </>
      }
      data={puzzles ?? []}
      renderItem={({ item }) => <PuzzleCard puzzle={item} />}
      contentContainerStyle={styles.puzzleList}
      edges={['top']}
      ListEmptyComponent={
        <PuzzleListEmptyState isLoading={isPuzzlesLoading} isError={isPuzzlesError} />
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.half,
    paddingBottom: Spacing.two,
  },
  puzzleList: {
    paddingHorizontal: Spacing.four,
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
