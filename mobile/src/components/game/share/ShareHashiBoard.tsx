import { useMemo } from 'react';

import { type HashiPuzzle } from '@/api/puzzle/puzzle';
import { CELL_GAP, HashiBoardSurface } from '@/components/game/HashiBoard/HashiBoard';
import { findConnections } from '@/utils/hashi/connections';

import { SHARE_ASSET_CONTENT_TARGET_SIZE } from './ShareAssetCard';

const MIN_SHARE_CELL_SIZE = 18;

type ShareHashiBoardProps = {
  puzzle: HashiPuzzle;
};

/**
 * Static, non-interactive rendering of an unsolved Hashi board, sized for off-platform sharing.
 */
export function ShareHashiBoard({ puzzle }: ShareHashiBoardProps) {
  const { cellSize, boardWidth, boardHeight } = useMemo(() => {
    const fromW = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width,
    );
    const fromH = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height,
    );
    const cSize = Math.max(MIN_SHARE_CELL_SIZE, Math.min(fromW, fromH));
    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const gridHeight = puzzle.height * cSize + CELL_GAP * (puzzle.height - 1);
    return { cellSize: cSize, boardWidth: gridWidth, boardHeight: gridHeight };
  }, [puzzle.width, puzzle.height]);

  const staticConnections = useMemo(() => findConnections(puzzle.islands), [puzzle.islands]);

  return (
    <HashiBoardSurface
      variant="static"
      puzzle={puzzle}
      cellSize={cellSize}
      boardWidth={boardWidth}
      boardHeight={boardHeight}
      connections={staticConnections}
    />
  );
}
