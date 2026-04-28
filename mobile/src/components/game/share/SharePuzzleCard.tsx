import { type ReactElement } from 'react';

import { type Puzzle, PuzzleType } from '@/api/puzzle/puzzle';
import { passiveExhaustiveGuard } from '@/utils/guardUtils';

import { ShareFlowBoard } from './ShareFlowBoard';
import { ShareHanjiBoard } from './ShareHanjiBoard';
import { ShareHashiBoard } from './ShareHashiBoard';
import { ShareMinesweeperBoard } from './ShareMinesweeperBoard';
import { ShareSlitherlinkBoard } from './ShareSlitherlinkBoard';

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
    case PuzzleType.Flow: {
      return <ShareFlowBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    case PuzzleType.Hanji: {
      return <ShareHanjiBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    case PuzzleType.Hashi: {
      return <ShareHashiBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    case PuzzleType.Minesweeper: {
      return <ShareMinesweeperBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    case PuzzleType.Slitherlink: {
      return <ShareSlitherlinkBoard puzzle={puzzle} durationMs={durationMs} />;
    }
    default:
      return passiveExhaustiveGuard(puzzle);
  }
}
