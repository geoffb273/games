import { type ReactNode, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { AppLoadingView } from '@/components/view/AppLoadingView';
import { useAuthFetchContext } from '@/context/AuthFetchContext';

/**
 * Shows the initial app loading view until the app is fully loaded
 *
 * Waits for auth and prefetch the first list of dailyChallenges and puzzles
 */
export function InitialLoadGuard({ children }: { children: ReactNode }) {
  const { status } = useAuthFetchContext();
  const { isLoading: isLoadingDailyChallenges, dailyChallenges } = useDailyChallengesQuery({
    enabled: status === 'authenticated',
  });
  const { isLoading: isLoadingPuzzles } = usePuzzlesQuery({
    dailyChallengeId: dailyChallenges[0]?.id,
    enabled: status === 'authenticated' && !isLoadingDailyChallenges,
  });
  const [showLoadingView, setShowLoadingView] = useState(true);

  const isLoading = status === 'loading' || isLoadingDailyChallenges || isLoadingPuzzles;

  if (isLoading || showLoadingView) {
    return <AppLoadingView isLoading={isLoading} onHidden={() => setShowLoadingView(false)} />;
  }

  if (status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <ErrorView
          title="Error"
          message="An error occurred while loading the app. Please close and try again"
        />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
