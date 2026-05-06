import { type ReactNode, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { Button } from '@/components/common/Button';
import { ErrorView } from '@/components/common/ErrorView';
import { Text } from '@/components/common/Text';
import { ShareDailyChallengeButton } from '@/components/game/share/ShareDailyChallengeButton';
import { PUZZLE_CARD_NORMAL_HEIGHT, PuzzleCard } from '@/components/PuzzleCard';
import { Spacing } from '@/constants/token';
import { usePuzzleListExpandedState } from '@/hooks/usePuzzleListExpandedState';
import { useTheme } from '@/hooks/useTheme';

export function PuzzleList({
  dailyChallengeId,
  puzzles,
  isLoading,
  isError,
  onRetry,
  error,
}: {
  dailyChallengeId: string;
  puzzles: Puzzle[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  error: unknown;
}) {
  const { shouldShowCompleteChallengeButton, isExpanded, setIsExpanded } =
    usePuzzleListExpandedState({
      dailyChallengeId,
      puzzles,
    });

  if (puzzles.length === 0) {
    return (
      <PuzzleListEmptyState
        isLoading={isLoading}
        isError={isError}
        onRetry={onRetry}
        error={error}
      />
    );
  }

  return (
    <Animated.View style={styles.puzzleList}>
      {puzzles.map((puzzle) => (
        <PuzzleListItemWrapper key={puzzle.id} open={isExpanded}>
          <PuzzleCard puzzle={puzzle} disabled={!isExpanded} />
        </PuzzleListItemWrapper>
      ))}
      {shouldShowCompleteChallengeButton && (
        <CompleteChallengeView
          isExpanded={isExpanded}
          dailyChallengeId={dailyChallengeId}
          onExpandCollapsePress={() => {
            setIsExpanded(!isExpanded);
          }}
        />
      )}
    </Animated.View>
  );
}

const COLLAPSED_CARD_HEIGHT = 10;
const CARD_EXPAND_COLLAPSE_MS = 300;

function PuzzleListItemWrapper({ children, open }: { children: ReactNode; open: boolean }) {
  const animatedHeight = useSharedValue(open ? PUZZLE_CARD_NORMAL_HEIGHT : COLLAPSED_CARD_HEIGHT);

  useEffect(() => {
    animatedHeight.value = withTiming(open ? PUZZLE_CARD_NORMAL_HEIGHT : COLLAPSED_CARD_HEIGHT, {
      duration: CARD_EXPAND_COLLAPSE_MS,
    });
  }, [animatedHeight, open]);

  const animatedWrapperStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
  }));

  return (
    <Animated.View style={[styles.wrapperContainer, animatedWrapperStyle]}>
      <View style={{ height: PUZZLE_CARD_NORMAL_HEIGHT }}>{children}</View>
    </Animated.View>
  );
}

function CompleteChallengeView({
  isExpanded,
  onExpandCollapsePress,
  dailyChallengeId,
}: {
  isExpanded: boolean;
  onExpandCollapsePress: () => void;
  dailyChallengeId: string;
}) {
  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown}>
      <ShareDailyChallengeButton dailyChallengeId={dailyChallengeId} />
      <View style={styles.expandCollapseButtonContainer}>
        <Button
          onPress={onExpandCollapsePress}
          variant="ghost"
          fullWidth
          leadingIcon={isExpanded ? 'chevron-up' : 'chevron-down'}
        />
      </View>
    </Animated.View>
  );
}

function PuzzleListEmptyState({
  isLoading,
  isError,
  onRetry,
  error,
}: {
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  error?: unknown;
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      {isLoading ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : isError ? (
        <ErrorView title="Unable to load puzzles" message={null} onRetry={onRetry} error={error} />
      ) : (
        <Text type="body" color="textSecondary" textAlign="center">
          No puzzles available
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
  },
  puzzleList: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
    overflow: 'visible',
  },
  wrapperContainer: {
    overflow: 'visible',
  },
  expandCollapseButtonContainer: {
    position: 'absolute',
    bottom: -Spacing.one,
    transform: [{ translateY: '100%' }],
    width: '100%',
  },
});
