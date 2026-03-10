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
 * Returns true if the grid has correct dimensions and every pair's two endpoints
 * are connected by a path of cells all having that pair's number.
 */
export function isFlowComplete(
  width: number,
  height: number,
  pairs: FlowPair[],
  grid: number[][],
): boolean {
  if (grid.length !== height || (height > 0 && grid[0].length !== width)) {
    return false;
  }

  for (const pair of pairs) {
    const [start, end] = pair.ends;
    const id = pair.number;

    if (grid[start.row]?.[start.col] !== id || grid[end.row]?.[end.col] !== id) {
      return false;
    }

    const visited = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => false),
    );
    const stack: [number, number][] = [[start.row, start.col]];
    visited[start.row][start.col] = true;
    let found = false;

    while (stack.length > 0) {
      const [r, c] = stack.pop()!;
      if (r === end.row && c === end.col) {
        found = true;
        break;
      }
      for (const [dr, dc] of CARDINAL) {
        const nr = r + dr;
        const nc = c + dc;
        if (
          nr >= 0 &&
          nr < height &&
          nc >= 0 &&
          nc < width &&
          !visited[nr][nc] &&
          grid[nr][nc] === id
        ) {
          visited[nr][nc] = true;
          stack.push([nr, nc]);
        }
      }
    }

    if (!found) {
      return false;
    }
  }

  return true;
}
