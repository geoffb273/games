import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, runOnJS } from 'react-native-reanimated';

import { useNavigation } from 'expo-router';

import { type Puzzle } from '@/api/puzzle/puzzle';
import { usePuzzleQuery } from '@/api/puzzle/puzzleQuery';
import { ErrorView } from '@/components/common/ErrorView';
import { GameViewFlowBoard } from '@/components/game/GameViewFlowBoard';
import { GameViewHanjiBoard } from '@/components/game/GameViewHanjiBoard';
import { GameViewHashiBoard } from '@/components/game/GameViewHashiBoard';
import { GameViewMinesweeperBoard } from '@/components/game/GameViewMinesweeperBoard';
import { GameViewSlitherlinkBoard } from '@/components/game/GameViewSlitherlinkBoard';
import { GameInstructionsButton } from '@/components/game/instructions/GameInstructionsButton';
import { PuzzleCompletedView } from '@/components/game/PuzzleCompletedView';
import { VerticallyCenteredLayout } from '@/components/layout/VerticallyCenteredLayout';
import { Spacing } from '@/constants/token';
import { useStableCallback } from '@/hooks/useStableCallback';

type TransitionPhase = 'playing' | 'exiting' | 'completed';

const BOARD_EXIT_DURATION_MS = 300;

export function GameView({ id }: { id: string }) {
  const { puzzle, isLoading, isError, isNotFound, refetch } = usePuzzleQuery({ id });

  const {
    shouldShowCompleted,
    showPlaceholder,
    boardExitAnimation,
    markBoardShown,
    onBoardAnimationComplete,
  } = usePuzzleBoardTransition({ puzzle, puzzleId: id });

  const isPuzzleMissing = !isLoading && puzzle == null;

  if (isNotFound && !isLoading) {
    return (
      <View style={styles.centered}>
        <ErrorView title="Puzzle not found" />
      </View>
    );
  }

  if (isError || isPuzzleMissing) {
    return (
      <View style={styles.centered}>
        <ErrorView message="Unable to load puzzle" onRetry={refetch} />
      </View>
    );
  }

  // Show completed view: loaded with attempt already, or after exit animation
  if (shouldShowCompleted && puzzle?.attempt != null) {
    return (
      <VerticallyCenteredLayout>
        <PuzzleCompletedView
          puzzleType={puzzle.type}
          solved={puzzle.attempt.completedAt != null}
          durationMs={puzzle.attempt.durationMs}
        />
      </VerticallyCenteredLayout>
    );
  }

  if (puzzle == null) {
    return null;
  }

  // Once we've detached the board wrapper, show a simple placeholder while the exit
  // animation overlay finishes.
  if (showPlaceholder) {
    return <View style={styles.placeholder} />;
  }

  return (
    <Animated.View exiting={boardExitAnimation} style={styles.boardExitWrapper}>
      <PuzzleBoard
        puzzle={puzzle}
        markBoardShown={markBoardShown}
        onBoardAnimationComplete={onBoardAnimationComplete}
      />
    </Animated.View>
  );
}

function PuzzleBoard({
  puzzle,
  markBoardShown,
  onBoardAnimationComplete,
}: {
  puzzle: Puzzle;
  markBoardShown: () => void;
  onBoardAnimationComplete: () => void;
}) {
  // Marks that the board has been shown so we can transition to the completed view on completion
  useEffect(() => {
    markBoardShown();
  }, [markBoardShown]);

  const navigation = useNavigation();

  const renderGameInstructionsButton = useStableCallback(() => {
    return <GameInstructionsButton puzzleType={puzzle.type} />;
  });

  useEffect(() => {
    navigation.setOptions({
      headerRight: renderGameInstructionsButton,
    });
  }, [navigation, renderGameInstructionsButton]);

  switch (puzzle.type) {
    case 'FLOW':
      return <GameViewFlowBoard puzzle={puzzle} />;
    case 'HANJI':
      return <GameViewHanjiBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />;
    case 'HASHI':
      return <GameViewHashiBoard puzzle={puzzle} onAnimationComplete={onBoardAnimationComplete} />;
    case 'MINESWEEPER':
      return <GameViewMinesweeperBoard puzzle={puzzle} />;
    case 'SLITHERLINK':
      return <GameViewSlitherlinkBoard puzzle={puzzle} />;
  }
}

type UsePuzzleBoardTransitionResult = {
  shouldShowCompleted: boolean;
  showPlaceholder: boolean;
  boardExitAnimation: ReturnType<(typeof FadeOut)['duration']>;
  markBoardShown: () => void;
  onBoardAnimationComplete: () => void;
};

/**
 * Handles the transition between the playing state (no attempt) and the exiting state (with attempt).
 *
 * @returns An object containing the shouldShowCompleted, showPlaceholder, boardExitAnimation, markBoardShown, and onBoardAnimationComplete functions.
 */
function usePuzzleBoardTransition({
  puzzle,
  puzzleId,
}: {
  puzzle: Puzzle | null;
  puzzleId: string;
}): UsePuzzleBoardTransitionResult {
  const [phase, setPhase] = useState<TransitionPhase | null>(null);
  const [showBoardForExit, setShowBoardForExit] = useState(false);
  const [animationCompleteFired, setAnimationCompleteFired] = useState(false);
  const hasShownBoardRef = useRef(false);
  const prevPuzzleIdRef = useRef<string | null>(null);

  // Reset transition state when puzzle ID changes (navigated to different puzzle)
  useEffect(() => {
    if (prevPuzzleIdRef.current !== puzzleId) {
      prevPuzzleIdRef.current = puzzleId;
      setPhase(null);
      setShowBoardForExit(false);
      setAnimationCompleteFired(false);
      hasShownBoardRef.current = false;
    }
  }, [puzzleId]);

  // When we have puzzle with no attempt, we're playing (for transition detection)
  useEffect(() => {
    if (puzzle != null && puzzle.attempt == null && phase === null) {
      setPhase('playing');
    }
  }, [puzzle, phase]);

  // Start exit phase only when we have an attempt AND (for Hanji and Hashi) the board has fired onAnimationComplete.
  const readyToExit =
    puzzle != null &&
    puzzle.attempt != null &&
    ((puzzle.type !== 'HANJI' && puzzle.type !== 'HASHI') || animationCompleteFired);

  useEffect(() => {
    if (!readyToExit) return;
    if (!hasShownBoardRef.current) {
      setPhase('completed');
      return;
    }
    if (phase === 'playing') {
      setPhase('exiting');
      setShowBoardForExit(true);
    }
  }, [phase, readyToExit]);

  // Unmount board wrapper on next frame so Reanimated runs exiting animation
  useEffect(() => {
    if (phase !== 'exiting' || !showBoardForExit) return;
    const raf = requestAnimationFrame(() => {
      setShowBoardForExit(false);
    });
    return () => cancelAnimationFrame(raf);
  }, [phase, showBoardForExit]);

  const handleBoardExitComplete = useCallback(() => {
    setPhase('completed');
  }, []);

  const boardExitAnimation = useMemo(
    () =>
      FadeOut.duration(BOARD_EXIT_DURATION_MS).withCallback((finished) => {
        'worklet';
        if (finished) {
          runOnJS(handleBoardExitComplete)();
        }
      }),
    [handleBoardExitComplete],
  );

  const shouldShowCompleted =
    puzzle?.attempt != null && (phase === 'completed' || !hasShownBoardRef.current);

  const showPlaceholder = phase === 'exiting' && !showBoardForExit;

  const onBoardAnimationComplete = useCallback(() => {
    setAnimationCompleteFired(true);
  }, []);

  const markBoardShown = () => {
    hasShownBoardRef.current = true;
  };

  return {
    shouldShowCompleted,
    showPlaceholder,
    boardExitAnimation,
    markBoardShown,
    onBoardAnimationComplete,
  };
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  boardExitWrapper: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
  },
});
