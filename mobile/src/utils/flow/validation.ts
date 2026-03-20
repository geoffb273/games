type FlowPair = {
  number: number;
  ends: [{ row: number; col: number }, { row: number; col: number }];
};

const CARDINAL: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/**
 * Returns true if the given grid is a valid solution for the puzzle:
 * dimensions match, grid is full (no zeros), each pair's endpoints are correct,
 * and each pair's cells form a single path connecting its endpoints.
 */
export function isFlowComplete(
  width: number,
  height: number,
  pairs: FlowPair[],
  grid: number[][],
): boolean {
  if (grid.length !== height || grid.some((row) => row.length !== width)) {
    return false;
  }
  const numPairs = pairs.length;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const v = grid[r][c];
      if (v < 0 || v > numPairs) return false;
      if (v === 0) return false; // grid must be full
    }
  }
  for (const pair of pairs) {
    const id = pair.number;
    const [a, b] = pair.ends;
    if (grid[a.row][a.col] !== id || grid[b.row][b.col] !== id) return false;
    let count = 0;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (grid[r][c] === id) count++;
      }
    }
    // BFS from a following only id; must reach b and visit exactly count cells
    const visited = new Set<string>();
    const key = (row: number, col: number) => `${row},${col}`;
    const queue: { row: number; col: number }[] = [{ row: a.row, col: a.col }];
    visited.add(key(a.row, a.col));
    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      for (const [dr, dc] of CARDINAL) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= height || c < 0 || c >= width) continue;
        if (grid[r][c] !== id) continue;
        const k = key(r, c);
        if (visited.has(k)) continue;
        visited.add(k);
        queue.push({ row: r, col: c });
      }
    }
    if (visited.size !== count) return false;
    if (!visited.has(key(b.row, b.col))) return false;
  }
  return true;
}
