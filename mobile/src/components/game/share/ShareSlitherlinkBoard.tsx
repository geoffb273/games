import { useMemo } from 'react';

import { type SlitherlinkPuzzle } from '@/api/puzzle/puzzle';
import {
  CELL_GAP,
  SlitherlinkBoardSurface,
} from '@/components/game/SlitherlinkBoard/SlitherlinkBoard';
import { type SlitherlinkGame } from '@/hooks/game/useSlitherlinkGame';

import { SHARE_ASSET_CONTENT_TARGET_SIZE } from './ShareAssetCard';

const MIN_SHARE_CELL_SIZE = 24;

type ShareSlitherlinkBoardProps = {
  puzzle: SlitherlinkPuzzle;
};

/**
 * Static, non-interactive rendering of an unsolved Slitherlink board, sized for off-platform sharing.
 */
export function ShareSlitherlinkBoard({ puzzle }: ShareSlitherlinkBoardProps) {
  const { cellSize, horizontal, vertical } = useMemo(() => {
    const fromW = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width,
    );
    const fromH = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height,
    );
    const cSize = Math.max(MIN_SHARE_CELL_SIZE, Math.min(fromW, fromH));
    const emptyHorizontal: SlitherlinkGame['horizontal'] = Array.from(
      { length: puzzle.height + 1 },
      () => Array.from({ length: puzzle.width }, () => 'empty'),
    );
    const emptyVertical: SlitherlinkGame['vertical'] = Array.from({ length: puzzle.height }, () =>
      Array.from({ length: puzzle.width + 1 }, () => 'empty'),
    );

    return { cellSize: cSize, horizontal: emptyHorizontal, vertical: emptyVertical };
  }, [puzzle.width, puzzle.height]);

  return (
    <SlitherlinkBoardSurface
      variant="static"
      puzzle={puzzle}
      cellSize={cellSize}
      horizontal={horizontal}
      vertical={vertical}
    />
  );
}
