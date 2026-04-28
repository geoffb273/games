import { type ReactElement } from 'react';

import { type Puzzle, PuzzleType } from '@/api/puzzle/puzzle';

import { ShareHashiBoard } from './ShareHashiBoard';

type SharePuzzleCardProps = {
  puzzle: Puzzle;
  durationMs: number | null | undefined;
};

/**
 * Returns the share-card React element for a given puzzle, or null when the
 * puzzle type does not yet have a share-card renderer or required completion
 * data is unavailable.
 */
export function SharePuzzleCard({ puzzle, durationMs }: SharePuzzleCardProps): ReactElement | null {
  switch (puzzle.type) {
    case PuzzleType.Hashi: {
      return <ShareHashiBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    default:
      return null;
  }
}
