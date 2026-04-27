import { type ReactElement } from 'react';

import { type Puzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { type PuzzleCompletionData } from '@/store/puzzleCompletionStore';

import { HashiShareCard } from './HashiShareCard';

type GetPuzzleShareCardInput = {
  puzzle: Puzzle;
  completion: PuzzleCompletionData | null;
  durationMs: number | null | undefined;
};

/**
 * Returns the share-card React element for a given puzzle, or null when the
 * puzzle type does not yet have a share-card renderer or required completion
 * data is unavailable.
 */
export function getPuzzleShareCard({
  puzzle,
  completion,
  durationMs,
}: GetPuzzleShareCardInput): ReactElement | null {
  if (completion == null) return null;

  switch (puzzle.type) {
    case PuzzleType.Hashi: {
      if (completion.type !== PuzzleType.Hashi) return null;
      return <HashiShareCard puzzle={puzzle} completion={completion} durationMs={durationMs} />;
    }
    default:
      return null;
  }
}
