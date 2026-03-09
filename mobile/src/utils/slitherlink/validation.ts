type EdgeGrid = boolean[][];

function countEdgesAroundCell(
  width: number,
  height: number,
  horizontal: EdgeGrid,
  vertical: EdgeGrid,
  row: number,
  col: number,
): number {
  if (row < 0 || row >= height || col < 0 || col >= width) {
    return 0;
  }

  let count = 0;

  if (horizontal[row][col]) count += 1;
  if (horizontal[row + 1]?.[col]) count += 1;
  if (vertical[row]?.[col]) count += 1;
  if (vertical[row]?.[col + 1]) count += 1;

  return count;
}

export function areCluesSatisfied(
  clues: (number | null)[][],
  horizontal: EdgeGrid,
  vertical: EdgeGrid,
): boolean {
  const height = clues.length;
  if (height === 0) return true;
  const width = clues[0].length;

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const clue = clues[r][c];
      if (clue == null) continue;
      if (countEdgesAroundCell(width, height, horizontal, vertical, r, c) !== clue) {
        return false;
      }
    }
  }

  return true;
}

function buildVertexAdjacency(
  width: number,
  height: number,
  horizontal: EdgeGrid,
  vertical: EdgeGrid,
): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();

  const key = (r: number, c: number) => `${r},${c}`;

  const addEdge = (r1: number, c1: number, r2: number, c2: number) => {
    const a = key(r1, c1);
    const b = key(r2, c2);
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };

  for (let r = 0; r < height + 1; r++) {
    for (let c = 0; c < width; c++) {
      if (!horizontal[r]?.[c]) continue;
      addEdge(r, c, r, c + 1);
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width + 1; c++) {
      if (!vertical[r]?.[c]) continue;
      addEdge(r, c, r + 1, c);
    }
  }

  return adj;
}

export function formsSingleLoop(
  width: number,
  height: number,
  horizontal: EdgeGrid,
  vertical: EdgeGrid,
): boolean {
  const adj = buildVertexAdjacency(width, height, horizontal, vertical);
  if (adj.size === 0) return false;

  let nonZeroDegreeCount = 0;
  let start: string | null = null;

  for (const [vertex, neighbors] of adj.entries()) {
    const degree = neighbors.size;
    if (degree === 0) continue;
    if (degree !== 2) {
      return false;
    }
    nonZeroDegreeCount += 1;
    if (start == null) start = vertex;
  }

  if (nonZeroDegreeCount === 0 || start == null) {
    return false;
  }

  const visited = new Set<string>();
  const stack = [start];
  visited.add(start);

  while (stack.length > 0) {
    const v = stack.pop()!;
    const neighbors = adj.get(v);
    if (!neighbors) continue;
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        stack.push(n);
      }
    }
  }

  return visited.size === nonZeroDegreeCount;
}

export function isSlitherlinkComplete(
  width: number,
  height: number,
  clues: (number | null)[][],
  horizontal: EdgeGrid,
  vertical: EdgeGrid,
): boolean {
  if (!areCluesSatisfied(clues, horizontal, vertical)) {
    return false;
  }

  return formsSingleLoop(width, height, horizontal, vertical);
}
