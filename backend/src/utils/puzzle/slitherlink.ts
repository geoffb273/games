import type { SlitherlinkPuzzleData } from '@/platform/puzzle/resource/puzzle';

import { createSeededRandom, stringToSeed } from '../randomUtils';

type Dot = {
  row: number;
  col: number;
};

type Edge = {
  from: Dot;
  to: Dot;
};

type GenerateSlitherlinkPuzzleDataOptions = {
  width: number;
  height: number;
  /** Optional seed for reproducibility */
  seed?: string | number;
};

/** String representation of an edge. */
function edgeKey(a: Dot, b: Dot): string {
  const fromRow = a.row;
  const fromCol = a.col;
  const toRow = b.row;
  const toCol = b.col;

  return `${fromRow},${fromCol}-${toRow},${toCol}`;
}

/** String representation of a dot. */
function dotKey(d: Dot): string {
  return `${d.row},${d.col}`;
}

/** Returns adjacent dots (up to 4) for the given dot within the grid bounds. */
function getDotNeighbors(dot: Dot, width: number, height: number): Dot[] {
  const { row, col } = dot;
  const neighbors: Dot[] = [];

  if (row > 0) neighbors.push({ row: row - 1, col });
  if (row < height) neighbors.push({ row: row + 1, col });
  if (col > 0) neighbors.push({ row, col: col - 1 });
  if (col < width) neighbors.push({ row, col: col + 1 });

  return neighbors;
}

/** Increments the degree count for the dot at (row, col) in the given map. */
function addDegree(degrees: Map<string, number>, row: number, col: number): void {
  const key = `${row},${col}`;
  degrees.set(key, (degrees.get(key) ?? 0) + 1);
}

/** Adds a bidirectional adjacency link between dots (aRow, aCol) and (bRow, bCol). */
function addAdjacencyLink(
  adjacency: Map<string, string[]>,
  aRow: number,
  aCol: number,
  bRow: number,
  bCol: number,
): void {
  const aKey = `${aRow},${aCol}`;
  const bKey = `${bRow},${bCol}`;
  const aList = adjacency.get(aKey);
  const bList = adjacency.get(bKey);

  if (aList) aList.push(bKey);
  else adjacency.set(aKey, [bKey]);

  if (bList) bList.push(aKey);
  else adjacency.set(bKey, [aKey]);
}

/**
 * Builds a random simple cycle on the dot grid using a random walk that closes back to the start.
 * @returns The edges of the cycle, or null if no valid cycle was found within the attempt limit.
 */
function buildRandomSimpleCycle(
  width: number,
  height: number,
  random: () => number,
): Edge[] | null {
  const maxAttempts = 200;
  const maxSteps = (width + 1) * (height + 1) * 4;

  const allDots: Dot[] = [];
  for (let r = 0; r <= height; r++) {
    for (let c = 0; c <= width; c++) {
      allDots.push({ row: r, col: c });
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const startIdx = Math.floor(random() * allDots.length);
    const start = allDots[startIdx];
    const startKey = dotKey(start);

    const visited = new Set<string>([startKey]);
    const degrees = new Map<string, number>();
    degrees.set(startKey, 0);

    const usedEdges = new Set<string>();
    const edges: Edge[] = [];

    let current = start;

    for (let step = 0; step < maxSteps; step++) {
      const neighbors = getDotNeighbors(current, width, height);

      for (let i = neighbors.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const tmp = neighbors[i];
        neighbors[i] = neighbors[j];
        neighbors[j] = tmp;
      }

      let moved = false;

      const currentKey = dotKey(current);
      const currentDegree = degrees.get(currentKey) ?? 0;

      for (const next of neighbors) {
        const nextKey = dotKey(next);
        const nextDegree = degrees.get(nextKey) ?? 0;

        if (currentDegree >= 2 || nextDegree >= 2) {
          continue;
        }

        const key = edgeKey(current, next);
        if (usedEdges.has(key)) {
          continue;
        }

        const isStart = nextKey === startKey;
        const alreadyVisited = visited.has(nextKey);

        if (isStart) {
          if (edges.length >= 3 && currentKey !== startKey && currentDegree === 1) {
            usedEdges.add(key);
            edges.push({ from: current, to: next });

            degrees.set(currentKey, currentDegree + 1);
            degrees.set(nextKey, (degrees.get(nextKey) ?? 0) + 1);

            return edges;
          }
          continue;
        }

        if (alreadyVisited) {
          continue;
        }

        usedEdges.add(key);
        edges.push({ from: current, to: next });

        degrees.set(currentKey, currentDegree + 1);
        degrees.set(nextKey, nextDegree + 1);

        visited.add(nextKey);
        current = next;
        moved = true;
        break;
      }

      if (!moved) {
        break;
      }
    }
  }

  return null;
}

/**
 * Converts a list of edges (from/to dots) into horizontal and vertical boolean grids.
 */
function buildEdgeGrids(
  width: number,
  height: number,
  edges: Edge[],
): { horizontalEdges: boolean[][]; verticalEdges: boolean[][] } {
  const horizontalEdges: boolean[][] = Array.from({ length: height + 1 }, () =>
    Array<boolean>(width).fill(false),
  );
  const verticalEdges: boolean[][] = Array.from({ length: height }, () =>
    Array<boolean>(width + 1).fill(false),
  );

  for (const edge of edges) {
    const { from, to } = edge;
    if (from.row === to.row) {
      const row = from.row;
      const col = Math.min(from.col, to.col);
      if (row >= 0 && row <= height && col >= 0 && col < width) {
        horizontalEdges[row][col] = true;
      }
    } else {
      const row = Math.min(from.row, to.row);
      const col = from.col;
      if (row >= 0 && row < height && col >= 0 && col <= width) {
        verticalEdges[row][col] = true;
      }
    }
  }

  return { horizontalEdges, verticalEdges };
}

/**
 * Returns true if the given edge grids form a single closed loop (every vertex degree 0 or 2, one component).
 */
function validateSingleLoop(
  width: number,
  height: number,
  horizontalEdges: boolean[][],
  verticalEdges: boolean[][],
): boolean {
  const degrees = new Map<string, number>();

  for (let r = 0; r <= height; r++) {
    for (let c = 0; c < width; c++) {
      if (horizontalEdges[r][c]) {
        addDegree(degrees, r, c);
        addDegree(degrees, r, c + 1);
      }
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c <= width; c++) {
      if (verticalEdges[r][c]) {
        addDegree(degrees, r, c);
        addDegree(degrees, r + 1, c);
      }
    }
  }

  const verticesWithEdges = Array.from(degrees.entries()).filter(([, deg]) => deg > 0);

  if (verticesWithEdges.length === 0) {
    return false;
  }

  for (const [, deg] of verticesWithEdges) {
    if (deg !== 2) {
      return false;
    }
  }

  const adjacency = new Map<string, string[]>();

  for (let r = 0; r <= height; r++) {
    for (let c = 0; c < width; c++) {
      if (horizontalEdges[r][c]) {
        addAdjacencyLink(adjacency, r, c, r, c + 1);
      }
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c <= width; c++) {
      if (verticalEdges[r][c]) {
        addAdjacencyLink(adjacency, r, c, r + 1, c);
      }
    }
  }

  const startKey = verticesWithEdges[0][0];
  const visited = new Set<string>();
  const stack = [startKey];
  visited.add(startKey);

  while (stack.length > 0) {
    const key = stack.pop();
    if (key === undefined) break;

    const neighbors = adjacency.get(key) ?? [];
    for (const n of neighbors) {
      if (!visited.has(n)) {
        visited.add(n);
        stack.push(n);
      }
    }
  }

  return visited.size === verticesWithEdges.length;
}

/**
 * Fills the clue grid: each cell gets the count (0–4) of solution edges on its border.
 */
function deriveClues(
  width: number,
  height: number,
  horizontalEdges: boolean[][],
  verticalEdges: boolean[][],
): (number | null)[][] {
  const clues: (number | null)[][] = Array.from({ length: height }, () =>
    Array<number | null>(width).fill(null),
  );

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      let count = 0;
      if (horizontalEdges[r][c]) count++;
      if (verticalEdges[r][c + 1]) count++;
      if (horizontalEdges[r + 1][c]) count++;
      if (verticalEdges[r][c]) count++;
      clues[r][c] = count;
    }
  }

  return clues;
}

/** Edge state: -1 unknown, 0 no line, 1 line */
type EdgeState = -1 | 0 | 1;

type SlitherlinkSolution = {
  horizontalEdges: boolean[][];
  verticalEdges: boolean[][];
};

/** Returns a deep copy of the horizontal and vertical edge state arrays. */
function cloneState(
  hState: EdgeState[][],
  vState: EdgeState[][],
): { hState: EdgeState[][]; vState: EdgeState[][] } {
  return {
    hState: hState.map((row) => row.slice()),
    vState: vState.map((row) => row.slice()),
  };
}

/**
 * Propagates constraints for cell (r, c): clue must equal the count of line edges on its border.
 * @returns false if the clue is violated.
 */
function propagateCell(
  clues: (number | null)[][],
  hState: EdgeState[][],
  vState: EdgeState[][],
  r: number,
  c: number,
): boolean {
  const clue = clues[r][c];
  if (clue === null) return true;

  const top = hState[r][c];
  const right = vState[r][c + 1];
  const bottom = hState[r + 1][c];
  const left = vState[r][c];

  const edges = [
    {
      val: top,
      set: (v: EdgeState) => {
        hState[r][c] = v;
      },
    },
    {
      val: right,
      set: (v: EdgeState) => {
        vState[r][c + 1] = v;
      },
    },
    {
      val: bottom,
      set: (v: EdgeState) => {
        hState[r + 1][c] = v;
      },
    },
    {
      val: left,
      set: (v: EdgeState) => {
        vState[r][c] = v;
      },
    },
  ];

  const ones = edges.filter((e) => e.val === 1).length;
  const unknowns = edges.filter((e) => e.val === -1);

  if (ones > clue) return false;
  if (ones + unknowns.length < clue) return false;

  if (clue === 0) {
    for (const e of edges) {
      if (e.val === 1) return false;
      e.set(0);
    }
    return true;
  }
  if (clue === 4) {
    for (const e of edges) {
      if (e.val === 0) return false;
      e.set(1);
    }
    return true;
  }
  if (clue === 1 && unknowns.length === 1 && ones === 0) {
    unknowns[0].set(1);
    return true;
  }
  if (clue === 1 && ones === 1) {
    for (const e of unknowns) e.set(0);
    return true;
  }
  if (clue === 3 && unknowns.length === 1 && ones === 3) {
    unknowns[0].set(0);
    return true;
  }
  if (clue === 3 && ones === 2) {
    for (const e of unknowns) e.set(1);
    return true;
  }
  if (clue === 2 && ones === 2) {
    for (const e of unknowns) e.set(0);
    return true;
  }
  if (clue === 2 && ones === 1 && unknowns.length === 1) {
    unknowns[0].set(1);
    return true;
  }
  return true;
}

/**
 * Propagates constraints for dot (row, col): it must have 0 or 2 incident line edges.
 * @returns false if the vertex would have 1 or 3 incident lines.
 */
function propagateDot(
  width: number,
  height: number,
  hState: EdgeState[][],
  vState: EdgeState[][],
  row: number,
  col: number,
): boolean {
  const edges: { val: EdgeState; set: (v: EdgeState) => void }[] = [];

  if (col > 0) {
    edges.push({
      val: hState[row][col - 1],
      set: (v) => {
        hState[row][col - 1] = v;
      },
    });
  }
  if (col < width) {
    edges.push({
      val: hState[row][col],
      set: (v) => {
        hState[row][col] = v;
      },
    });
  }
  if (row > 0) {
    edges.push({
      val: vState[row - 1][col],
      set: (v) => {
        vState[row - 1][col] = v;
      },
    });
  }
  if (row < height) {
    edges.push({
      val: vState[row][col],
      set: (v) => {
        vState[row][col] = v;
      },
    });
  }

  const ones = edges.filter((e) => e.val === 1).length;
  const unknowns = edges.filter((e) => e.val === -1);

  if (ones > 2) return false;
  if (ones === 2) {
    for (const e of unknowns) e.set(0);
    return true;
  }
  if (ones === 1 && unknowns.length === 1) {
    unknowns[0].set(1);
    return true;
  }
  if (ones === 3) return false;
  return true;
}

/** Returns true if the two edge-state snapshots are equal. */
function stateEquals(
  a: { hState: EdgeState[][]; vState: EdgeState[][] },
  hState: EdgeState[][],
  vState: EdgeState[][],
): boolean {
  return (
    a.hState.every((row, i) => row.every((v, j) => v === hState[i][j])) &&
    a.vState.every((row, i) => row.every((v, j) => v === vState[i][j]))
  );
}

/**
 * Runs cell and dot propagation until no further deductions; returns false on contradiction.
 */
function propagate(
  width: number,
  height: number,
  clues: (number | null)[][],
  hState: EdgeState[][],
  vState: EdgeState[][],
): boolean {
  let converged = false;
  while (!converged) {
    const before = cloneState(hState, vState);
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (!propagateCell(clues, hState, vState, r, c)) return false;
      }
    }
    for (let row = 0; row <= height; row++) {
      for (let col = 0; col <= width; col++) {
        if (!propagateDot(width, height, hState, vState, row, col)) return false;
      }
    }
    converged = stateEquals(before, hState, vState);
  }
  return true;
}

/** Converts edge state arrays (-1/0/1) to solution format (boolean grids; -1 treated as false). */
function stateToSolution(hState: EdgeState[][], vState: EdgeState[][]): SlitherlinkSolution {
  return {
    horizontalEdges: hState.map((row) => row.map((v) => v === 1)),
    verticalEdges: vState.map((row) => row.map((v) => v === 1)),
  };
}

/** Returns the first edge still unknown (-1), or null if all are assigned. */
function findFirstUnknown(
  hState: EdgeState[][],
  vState: EdgeState[][],
): { type: 'H' | 'V'; r: number; c: number } | null {
  for (let r = 0; r < hState.length; r++) {
    for (let c = 0; c < hState[r].length; c++) {
      if (hState[r][c] === -1) return { type: 'H', r, c };
    }
  }
  for (let r = 0; r < vState.length; r++) {
    for (let c = 0; c < vState[r].length; c++) {
      if (vState[r][c] === -1) return { type: 'V', r, c };
    }
  }
  return null;
}

/**
 * Finds up to maxSolutions solutions to the Slitherlink puzzle with the given clues.
 * Uses constraint propagation and backtracking; only counts assignments that form a single loop.
 * @param maxSolutions Stop after finding this many solutions (e.g. 2 to check uniqueness).
 * @returns Array of solutions, each with horizontalEdges and verticalEdges. Exported for tests.
 */
export function findSlitherlinkSolutions(
  width: number,
  height: number,
  clues: (number | null)[][],
  maxSolutions: number,
): SlitherlinkSolution[] {
  const solutions: SlitherlinkSolution[] = [];

  function solve(hState: EdgeState[][], vState: EdgeState[][]): void {
    if (solutions.length >= maxSolutions) return;

    if (!propagate(width, height, clues, hState, vState)) return;

    const unknown = findFirstUnknown(hState, vState);
    if (unknown === null) {
      const sol = stateToSolution(hState, vState);
      if (validateSingleLoop(width, height, sol.horizontalEdges, sol.verticalEdges)) {
        solutions.push(sol);
      }
      return;
    }

    const { type, r, c } = unknown;
    if (type === 'H') {
      const state0 = cloneState(hState, vState);
      state0.hState[r][c] = 0;
      solve(state0.hState, state0.vState);
      if (solutions.length >= maxSolutions) return;
      const state1 = cloneState(hState, vState);
      state1.hState[r][c] = 1;
      solve(state1.hState, state1.vState);
    } else {
      const state0 = cloneState(hState, vState);
      state0.vState[r][c] = 0;
      solve(state0.hState, state0.vState);
      if (solutions.length >= maxSolutions) return;
      const state1 = cloneState(hState, vState);
      state1.vState[r][c] = 1;
      solve(state1.hState, state1.vState);
    }
  }

  const hState: EdgeState[][] = Array.from(
    { length: height + 1 },
    () => Array<number>(width).fill(-1) as EdgeState[],
  );
  const vState: EdgeState[][] = Array.from(
    { length: height },
    () => Array<number>(width + 1).fill(-1) as EdgeState[],
  );
  solve(hState, vState);
  return solutions;
}

const MAX_UNIQUE_ATTEMPTS = 100;

/**
 * Generates Slitherlink puzzle data with a unique solution.
 * Builds random loops, derives clues, and retries until the solver finds exactly one solution.
 * @param width Grid width (number of cells).
 * @param height Grid height (number of cells).
 * @param seed Optional seed for reproducible generation.
 * @throws Error if no uniquely solvable puzzle is found within the attempt limit.
 */
export function generateSlitherlinkPuzzleData({
  width,
  height,
  seed,
}: GenerateSlitherlinkPuzzleDataOptions): SlitherlinkPuzzleData {
  const baseSeed = `${seed ?? Date.now()}`;

  for (let attempt = 0; attempt < MAX_UNIQUE_ATTEMPTS; attempt++) {
    const attemptSeed = `${baseSeed}-u${attempt}`;
    const attemptNumeric = stringToSeed(attemptSeed);
    const attemptRandom = createSeededRandom(attemptNumeric);

    const edges = buildRandomSimpleCycle(width, height, attemptRandom);
    if (!edges) continue;

    const { horizontalEdges, verticalEdges } = buildEdgeGrids(width, height, edges);

    const isValidLoop = validateSingleLoop(width, height, horizontalEdges, verticalEdges);
    if (!isValidLoop) continue;

    const clues = deriveClues(width, height, horizontalEdges, verticalEdges);

    const solutions = findSlitherlinkSolutions(width, height, clues, 2);
    if (solutions.length !== 1) continue;

    return {
      width,
      height,
      clues,
      solution: {
        horizontalEdges,
        verticalEdges,
      },
    };
  }

  throw new Error(
    `Failed to generate a uniquely solvable Slitherlink puzzle for grid ${width}x${height} after ${MAX_UNIQUE_ATTEMPTS} attempts`,
  );
}
