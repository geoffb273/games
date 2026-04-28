import { useMemo } from 'react';

import { type FlowPuzzle } from '@/api/puzzle/puzzle';
import { CELL_GAP, FlowBoardSurface } from '@/components/game/FlowBoard/FlowBoard';

import { SHARE_ASSET_CONTENT_TARGET_SIZE, ShareAssetCard } from './ShareAssetCard';

const MIN_SHARE_CELL_SIZE = 18;

type ShareFlowBoardProps = {
  puzzle: FlowPuzzle;
  durationMs: number | null | undefined;
};

/**
 * Static, non-interactive rendering of an unsolved Flow board, sized for off-platform sharing.
 */
export function ShareFlowBoard({ puzzle, durationMs }: ShareFlowBoardProps) {
  const { cellSize, grid } = useMemo(() => {
    const fromW = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width,
    );
    const fromH = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height,
    );
    const cSize = Math.max(MIN_SHARE_CELL_SIZE, Math.min(fromW, fromH));
    const emptyGrid = Array.from({ length: puzzle.height }, () =>
      Array.from({ length: puzzle.width }, () => 0),
    );

    return { cellSize: cSize, grid: emptyGrid };
  }, [puzzle.width, puzzle.height]);

  return (
    <ShareAssetCard
      title={puzzle.name}
      dailyChallengeDate={puzzle.dailyChallenge.date}
      durationMs={durationMs}
    >
      <FlowBoardSurface variant="static" puzzle={puzzle} cellSize={cellSize} grid={grid} />
    </ShareAssetCard>
  );
}
