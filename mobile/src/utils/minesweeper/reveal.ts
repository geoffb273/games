import type { MinesweeperCellValueDisplay } from '@/api/puzzle/puzzle';

const NEIGHBORS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
] as const;

function getNeighbors(
  row: number,
  col: number,
  width: number,
  height: number,
): { row: number; col: number }[] {
  const result: { row: number; col: number }[] = [];
  for (const [dr, dc] of NEIGHBORS) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
      result.push({ row: nr, col: nc });
    }
  }
  return result;
}

export type RevealResult =
  | { hitMine: true; cells: [] }
  | { hitMine: false; cells: { row: number; col: number; value: number }[] };

/**
 * Computes which cells to reveal when the user taps (row, col).
 * If the cell is a mine, returns hitMine: true.
 * If the cell is 1-8, returns just that cell.
 * If the cell is 0, flood-fills to reveal the connected component of zeros and their numbered border.
 */
export function getCellsToReveal(
  row: number,
  col: number,
  mineField: MinesweeperCellValueDisplay[][],
  width: number,
  height: number,
): RevealResult {
  const value = mineField[row]?.[col];
  if (value === undefined) return { hitMine: false, cells: [] };
  if (value === 'MINE') return { hitMine: true, cells: [] };
  if (value >= 1 && value <= 8) {
    return { hitMine: false, cells: [{ row, col, value }] };
  }
  // value === 0: flood-fill
  const key = (r: number, c: number) => `${r},${c}`;
  const visited = new Set<string>();
  const queue: { row: number; col: number }[] = [{ row, col }];
  const cells: { row: number; col: number; value: number }[] = [];

  while (queue.length > 0) {
    const cell = queue.shift()!;
    const k = key(cell.row, cell.col);
    if (visited.has(k)) continue;
    visited.add(k);
    const v = mineField[cell.row][cell.col];
    if (v === 'MINE') continue;
    cells.push({ row: cell.row, col: cell.col, value: v });
    if (v === 0) {
      for (const n of getNeighbors(cell.row, cell.col, width, height)) {
        const nk = key(n.row, n.col);
        if (visited.has(nk)) continue;
        if (mineField[n.row][n.col] === 'MINE') continue;
        queue.push(n);
      }
    }
  }

  return { hitMine: false, cells };
}
