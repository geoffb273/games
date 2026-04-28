import { useMemo } from 'react';

import { type HanjiPuzzle } from '@/api/puzzle/puzzle';
import {
  CELL_GAP,
  CLUE_LINE_HEIGHT,
  HanjiBoardSurface,
} from '@/components/game/HanjiBoard/HanjiBoard';
import { Spacing } from '@/constants/token';
import { type HanjiCellState } from '@/utils/hanji/lineValidation';

import { SHARE_ASSET_CONTENT_TARGET_SIZE, ShareAssetCard } from './ShareAssetCard';

const MIN_SHARE_CELL_SIZE = 12;

type ShareHanjiBoardProps = {
  puzzle: HanjiPuzzle;
  durationMs: number | null | undefined;
};

/**
 * Static, non-interactive rendering of an unsolved Hanji board, sized for off-platform sharing.
 */
export function ShareHanjiBoard({ puzzle, durationMs }: ShareHanjiBoardProps) {
  const { cellSize, rowClueWidth, colClueHeight, boardWidth, cells } = useMemo(() => {
    const maxRowClueLen = Math.max(0, ...puzzle.rowClues.map((r) => r.length));
    const maxColClueLen = Math.max(0, ...puzzle.colClues.map((c) => c.length));
    const rClueW = maxRowClueLen > 0 ? maxRowClueLen * 10 + Spacing.two : 0;
    const cClueH = maxColClueLen > 0 ? maxColClueLen * CLUE_LINE_HEIGHT + Spacing.one : 0;

    const availW = SHARE_ASSET_CONTENT_TARGET_SIZE - rClueW - CELL_GAP;
    const availH = SHARE_ASSET_CONTENT_TARGET_SIZE - cClueH - CELL_GAP;
    const fromW = Math.floor((availW - CELL_GAP * (puzzle.width - 1)) / puzzle.width);
    const fromH = Math.floor((availH - CELL_GAP * (puzzle.height - 1)) / puzzle.height);
    const cSize = Math.max(MIN_SHARE_CELL_SIZE, Math.min(fromW, fromH));
    const gridWidth = puzzle.width * cSize + CELL_GAP * (puzzle.width - 1);
    const totalWidth = rClueW + CELL_GAP + gridWidth;
    const emptyCells: HanjiCellState[][] = Array.from({ length: puzzle.height }, () =>
      Array.from({ length: puzzle.width }, (): HanjiCellState => 'empty'),
    );

    return {
      cellSize: cSize,
      rowClueWidth: Math.max(rClueW, 24),
      colClueHeight: Math.max(cClueH, 20),
      boardWidth: totalWidth,
      cells: emptyCells,
    };
  }, [puzzle.width, puzzle.height, puzzle.rowClues, puzzle.colClues]);

  return (
    <ShareAssetCard
      title={puzzle.name}
      dailyChallengeDate={puzzle.dailyChallenge.date}
      durationMs={durationMs}
    >
      <HanjiBoardSurface
        variant="static"
        puzzle={puzzle}
        cellSize={cellSize}
        rowClueWidth={rowClueWidth}
        colClueHeight={colClueHeight}
        boardWidth={boardWidth}
        cells={cells}
      />
    </ShareAssetCard>
  );
}
