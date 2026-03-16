export type HanjiCellState = 'empty' | 'filled' | 'marked';

/**
 * Returns the run lengths of consecutive 'filled' cells in a line.
 * E.g. ['filled','filled','marked','filled'] → [2, 1]
 */
export function getRuns(line: HanjiCellState[]): number[] {
  const runs: number[] = [];
  let run = 0;
  for (const cell of line) {
    if (cell === 'filled') {
      run += 1;
    } else {
      if (run > 0) {
        runs.push(run);
        run = 0;
      }
    }
  }
  if (run > 0) runs.push(run);
  return runs;
}

/**
 * True if the line's filled runs exactly match the given clues.
 */
export function lineMatchesClues(line: HanjiCellState[], clues: number[]): boolean {
  const runs = getRuns(line);
  if (runs.length !== clues.length) return false;
  return runs.every((r, i) => r === clues[i]);
}

/**
 * True when every row and column
 * has filled runs that match the puzzle clues.
 */
export function isPuzzleComplete(
  grid: HanjiCellState[][],
  rowClues: number[][],
  colClues: number[][],
  width: number,
  height: number,
): boolean {
  for (let r = 0; r < height; r++) {
    if (!lineMatchesClues(grid[r], rowClues[r])) return false;
  }
  for (let c = 0; c < width; c++) {
    const col = grid.map((row) => row[c]);
    if (!lineMatchesClues(col, colClues[c])) return false;
  }
  return true;
}
