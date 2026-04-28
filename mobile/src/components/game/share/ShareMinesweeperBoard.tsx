import { useMemo } from 'react';

import { type MinesweeperPuzzle } from '@/api/puzzle/puzzle';
import {
  CELL_GAP,
  MinesweeperBoardSurface,
} from '@/components/game/MinesweeperBoard/MinesweeperBoard';
import { type MinesweeperGame } from '@/hooks/game/useMinesweeperGame';

import { SHARE_ASSET_CONTENT_TARGET_SIZE, ShareAssetCard } from './ShareAssetCard';

const MIN_SHARE_CELL_SIZE = 18;

type ShareMinesweeperBoardProps = {
  puzzle: MinesweeperPuzzle;
  durationMs: number | null | undefined;
};

/**
 * Static, non-interactive rendering of an unsolved Minesweeper board, sized for off-platform sharing.
 */
export function ShareMinesweeperBoard({ puzzle, durationMs }: ShareMinesweeperBoardProps) {
  const { cellSize, revealedMap, cells } = useMemo(() => {
    const fromW = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.width - 1)) / puzzle.width,
    );
    const fromH = Math.floor(
      (SHARE_ASSET_CONTENT_TARGET_SIZE - CELL_GAP * (puzzle.height - 1)) / puzzle.height,
    );
    const cSize = Math.max(MIN_SHARE_CELL_SIZE, Math.min(fromW, fromH));
    const initialRevealedMap = new Map<string, number>();

    for (const { row, col, value } of puzzle.revealedCells) {
      initialRevealedMap.set(`${row},${col}`, value);
    }

    const hiddenCells: MinesweeperGame['cells'] = Array.from({ length: puzzle.height }, () =>
      Array.from({ length: puzzle.width }, () => 'hidden'),
    );

    return { cellSize: cSize, revealedMap: initialRevealedMap, cells: hiddenCells };
  }, [puzzle.width, puzzle.height, puzzle.revealedCells]);

  return (
    <ShareAssetCard
      title={puzzle.name}
      dailyChallengeDate={puzzle.dailyChallenge.date}
      durationMs={durationMs}
    >
      <MinesweeperBoardSurface
        variant="static"
        puzzle={puzzle}
        cellSize={cellSize}
        revealedMap={revealedMap}
        cells={cells}
        triggeredMineCell={null}
      />
    </ShareAssetCard>
  );
}
