import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useDailyChallengesQuery } from '@/api/dailyChallenge/dailyChallengesQuery';
import { usePuzzlesQuery } from '@/api/puzzle/puzzlesQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { AppLoadingView } from '@/components/view/AppLoadingView';
import { useAuthFetchContext } from '@/context/AuthFetchContext';
import { useTimeoutEffect } from '@/hooks/useTimeoutEffect';

const MIN_LOADING_VIEW_MS = 500;

/**
 * Shows the initial app loading view until the app is fully loaded
 *
 * Waits for auth and prefetch the first list of dailyChallenges and puzzles
 */
export function InitialLoadGuard({ children }: { children: ReactNode }) {
  const { status } = useAuthFetchContext();
  const {
    isLoading: isLoadingDailyChallenges,
    dailyChallenges,
    error: errorDailyChallenges,
  } = useDailyChallengesQuery({
    enabled: status === 'authenticated',
  });
  const { isLoading: isLoadingPuzzles, error: errorPuzzles } = usePuzzlesQuery({
    dailyChallengeId: dailyChallenges[0]?.id,
    enabled: status === 'authenticated' && !isLoadingDailyChallenges,
  });
  const [showLoadingView, setShowLoadingView] = useState(true);
  const [hasRequestedHide, setHasRequestedHide] = useState(false);
  const [hasMinDurationElapsed, setHasMinDurationElapsed] = useState(false);

  useTimeoutEffect(
    () => {
      setHasMinDurationElapsed(true);
    },
    [],
    MIN_LOADING_VIEW_MS,
  );

  useEffect(() => {
    if (hasRequestedHide && hasMinDurationElapsed) {
      setShowLoadingView(false);
    }
  }, [hasRequestedHide, hasMinDurationElapsed]);

  const isLoading = status === 'loading' || isLoadingDailyChallenges || isLoadingPuzzles;

  if (isLoading || showLoadingView) {
    return (
      <AppLoadingView
        isLoading={isLoading}
        onHidden={() => {
          setHasRequestedHide(true);
        }}
      />
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.errorContainer}>
        <ErrorView
          title="Error"
          message="An error occurred while loading the app. Please close and try again"
          error={errorDailyChallenges ?? errorPuzzles}
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
