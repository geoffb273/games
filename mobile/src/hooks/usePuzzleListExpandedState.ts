import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFocusEffect } from 'expo-router';

import { areAllDailyPuzzlesAttempted, type Puzzle } from '@/api/puzzle/puzzle';

import { useStableCallback } from './useStableCallback';
import { useTimeoutEffect } from './useTimeoutEffect';

const storedExpandedByDailyChallengeId: Record<string, boolean> = {};

export function usePuzzleListExpandedState({
  dailyChallengeId,
  puzzles,
}: {
  dailyChallengeId: string;
  puzzles: Puzzle[];
}) {
  const hasFirstLandingFired = useRef(false);
  const firstDailyChallengeId = useRef<string>(dailyChallengeId);
  const allPuzzlesSolved = useMemo(() => areAllDailyPuzzlesAttempted(puzzles), [puzzles]);
  const allPuzzlesSolvedRef = useRef(allPuzzlesSolved);
  const [isExpanded, setIsExpandedState] = useState(true);

  const setIsExpanded = useStableCallback((expanded: boolean) => {
    setIsExpandedState(expanded);
    storedExpandedByDailyChallengeId[dailyChallengeId] = expanded;
  });

  // Update expand state based on stored value or if first landing for this daily challenge
  // set expand state based on all puzzles solved
  useEffect(() => {
    if (!hasFirstLandingFired.current && firstDailyChallengeId.current === dailyChallengeId) {
      return;
    }
    hasFirstLandingFired.current = true;

    setIsExpanded(storedExpandedByDailyChallengeId[dailyChallengeId] ?? !allPuzzlesSolved);
  }, [dailyChallengeId, allPuzzlesSolved, setIsExpanded]);

  // To have a nice animation when the user first lands on the page, we need to wait for the page to be fully rendered before
  // setting the proper expanded state
  useTimeoutEffect(
    () => {
      if (hasFirstLandingFired.current) {
        return;
      }

      hasFirstLandingFired.current = true;
      setIsExpanded(!allPuzzlesSolvedRef.current);
    },
    [setIsExpanded],
    300,
  );

  // On transition from not all puzzles solved to all puzzles solved, collapse the list
  useFocusEffect(
    useCallback(() => {
      const savedAllPuzzlesSolved = allPuzzlesSolvedRef.current;
      allPuzzlesSolvedRef.current = allPuzzlesSolved;

      if (!allPuzzlesSolved || allPuzzlesSolved === savedAllPuzzlesSolved) {
        return;
      }

      setIsExpanded(false);
    }, [allPuzzlesSolved, setIsExpanded]),
  );

  return { isExpanded, setIsExpanded, shouldShowCompleteChallengeButton: allPuzzlesSolved };
}
