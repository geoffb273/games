import { useEffect, useMemo, useRef, useState } from 'react';

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
      setIsExpanded(!allPuzzlesSolved);
    },
    [allPuzzlesSolved, setIsExpanded],
    300,
  );

  return { isExpanded, setIsExpanded, shouldShowCompleteChallengeButton: allPuzzlesSolved };
}
