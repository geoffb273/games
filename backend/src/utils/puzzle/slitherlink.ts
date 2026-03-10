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

const LOOP_MIN_LENGTH_BASELINE = 8;
const LOOP_MIN_LENGTH_FRACTION = 0.55;
const LOOP_MIN_TURNS_BASELINE = 5;
const SMALL_GRID_PERIMETER_THRESHOLD = 10;

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
 * Computes basic loop metrics for a candidate solution loop.
 *
 * Measures total edge count, the number of direction changes (turns),
 * and whether the loop traces a simple axis-aligned rectangle.
 */
function computeLoopMetrics(
  width: number,
  height: number,
  horizontalEdges: boolean[][],
  verticalEdges: boolean[][],
): { length: number; turns: number; isAxisAlignedRectangle: boolean } {
  let length = 0;
  for (let r = 0; r <= height; r++) {
    for (let c = 0; c < width; c++) {
      if (horizontalEdges[r][c]) {
        length++;
      }
    }
  }
  for (let r = 0; r < height; r++) {
    for (let c = 0; c <= width; c++) {
      if (verticalEdges[r][c]) {
        length++;
      }
    }
  }

  let turns = 0;
  let minRow = Number.POSITIVE_INFINITY;
  let maxRow = Number.NEGATIVE_INFINITY;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = Number.NEGATIVE_INFINITY;

  const incidentCounts: number[][] = Array.from({ length: height + 1 }, () =>
    Array<number>(width + 1).fill(0),
  );

  for (let row = 0; row <= height; row++) {
    for (let col = 0; col <= width; col++) {
      let incident = 0;
      let horiz = 0;
      let vert = 0;

      if (col > 0 && horizontalEdges[row][col - 1]) {
        incident++;
        horiz++;
      }
      if (col < width && horizontalEdges[row][col]) {
        incident++;
        horiz++;
      }
      if (row > 0 && verticalEdges[row - 1][col]) {
        incident++;
        vert++;
      }
      if (row < height && verticalEdges[row][col]) {
        incident++;
        vert++;
      }

      incidentCounts[row][col] = incident;

      if (incident > 0) {
        if (row < minRow) minRow = row;
        if (row > maxRow) maxRow = row;
        if (col < minCol) minCol = col;
        if (col > maxCol) maxCol = col;
      }

      if (incident === 2 && horiz === 1 && vert === 1) {
        turns++;
      }
    }
  }

  if (length === 0) {
    return { length: 0, turns: 0, isAxisAlignedRectangle: false };
  }

  let isAxisAlignedRectangle = true;
  for (let row = 0; row <= height; row++) {
    for (let col = 0; col <= width; col++) {
      const incident = incidentCounts[row][col];
      if (incident === 0) continue;

      const onBorder = row === minRow || row === maxRow || col === minCol || col === maxCol;
      if (!onBorder) {
        isAxisAlignedRectangle = false;
        break;
      }
    }
    if (!isAxisAlignedRectangle) break;
  }

  if (isAxisAlignedRectangle) {
    for (let row = minRow; row <= maxRow && isAxisAlignedRectangle; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const onBorder = row === minRow || row === maxRow || col === minCol || col === maxCol;
        if (onBorder && incidentCounts[row][col] === 0) {
          isAxisAlignedRectangle = false;
          break;
        }
      }
    }
  }

  return { length, turns, isAxisAlignedRectangle };
}

/**
 * Heuristic check to decide if a candidate loop is sufficiently “interesting”.
 *
 * Enforces a minimum loop length and number of turns (scaled by grid size)
 * and rejects simple axis-aligned rectangles and degenerate loops.
 */
function isLoopComplexEnough(
  width: number,
  height: number,
  horizontalEdges: boolean[][],
  verticalEdges: boolean[][],
): boolean {
  const { length, turns, isAxisAlignedRectangle } = computeLoopMetrics(
    width,
    height,
    horizontalEdges,
    verticalEdges,
  );

  if (length === 0) {
    return false;
  }

  const perimeter = 2 * (width + height);
  let minLength: number;
  let minTurns: number;

  if (perimeter <= SMALL_GRID_PERIMETER_THRESHOLD) {
    minLength = Math.max(4, Math.floor(0.75 * perimeter));
    minTurns = 4;
  } else {
    const minLengthFromPerimeter = Math.floor(LOOP_MIN_LENGTH_FRACTION * perimeter);
    minLength = Math.max(LOOP_MIN_LENGTH_BASELINE, minLengthFromPerimeter);
    minTurns = LOOP_MIN_TURNS_BASELINE;
  }

  if (length < minLength) {
    return false;
  }

  if (turns < minTurns) {
    return false;
  }

  if (isAxisAlignedRectangle) {
    return false;
  }

  return true;
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

const TARGET_CLUE_DENSITY_MIN = 0.25;
const TARGET_CLUE_DENSITY_MAX = 0.4;
const MAX_CLUE_REMOVAL_ATTEMPTS_MULTIPLIER = 3;

/**
 * Thins a full clue grid into a sparser, more informative one while preserving uniqueness.
 *
 * Starts from a fully-clued, uniquely-solvable puzzle, removes mostly low-information clues
 * towards a target density, then adds clues back if needed until the puzzle is uniquely solvable again.
 */
function sparsifyClues(
  width: number,
  height: number,
  fullClues: (number | null)[][],
  random: () => number,
): (number | null)[][] {
  const totalCells = width * height;
  if (totalCells === 0) {
    return fullClues;
  }

  const targetDensity =
    TARGET_CLUE_DENSITY_MIN + random() * (TARGET_CLUE_DENSITY_MAX - TARGET_CLUE_DENSITY_MIN);
  const targetNonNull = Math.max(1, Math.floor(totalCells * targetDensity));

  const clues: (number | null)[][] = fullClues.map((row) => row.slice());

  type Cell = { r: number; c: number; priority: number };
  const cells: Cell[] = [];

  function cluePriority(value: number | null): number {
    if (value === null) return 10;
    if (value === 0) return 0;
    if (value === 4) return 1;
    if (value === 2) return 2;
    return 3;
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const value = clues[r][c];
      cells.push({ r, c, priority: cluePriority(value) });
    }
  }

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const tmp = cells[i];
    cells[i] = cells[j];
    cells[j] = tmp;
  }

  cells.sort((a, b) => a.priority - b.priority);

  let nonNullCount = totalCells;
  const maxAttempts = totalCells * MAX_CLUE_REMOVAL_ATTEMPTS_MULTIPLIER;
  let attempts = 0;
  const removed: Cell[] = [];

  // First pass: aggressively remove low-priority clues without
  // re-checking uniqueness on every single change.
  for (const cell of cells) {
    if (nonNullCount <= targetNonNull) break;
    if (attempts >= maxAttempts) break;

    const { r, c } = cell;
    if (clues[r][c] === null) continue;

    const original = clues[r][c];
    // Remove in priority order (0, 4, 2, 3, 1) so we keep the most informative clues when sparse.
    clues[r][c] = null;
    attempts++;

    removed.push({ r, c, priority: cluePriority(original) });
    nonNullCount--;
  }

  // Check uniqueness after the removal phase.
  const solutions = findSlitherlinkSolutions(width, height, clues, 2);
  if (solutions.length === 1) {
    return clues;
  }

  // Binary-search repair: find minimal number of clues to add back (by priority) for uniqueness.
  removed.sort((a, b) => b.priority - a.priority);
  const baseClues = clues.map((row) => row.slice());

  let low = 0;
  let high = removed.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    const workClues = baseClues.map((row) => row.slice());
    for (let i = 0; i < mid; i++) {
      const { r, c } = removed[i];
      workClues[r][c] = fullClues[r][c];
    }
    const sols = findSlitherlinkSolutions(width, height, workClues, 2);
    if (sols.length === 1) {
      high = mid;
    } else {
      low = mid + 1;
    }
  }

  for (let i = 0; i < low; i++) {
    const { r, c } = removed[i];
    clues[r][c] = fullClues[r][c];
  }

  const finalSolutions = findSlitherlinkSolutions(width, height, clues, 2);
  if (finalSolutions.length === 1) {
    return clues;
  }

  // As a last resort, fall back to the fully-clued, unique puzzle.
  return fullClues;
}

/** Edge state: -1 unknown, 0 no line, 1 line */
type EdgeState = -1 | 0 | 1;

type SlitherlinkSolution = {
  horizontalEdges: boolean[][];
  verticalEdges: boolean[][];
};

/**
 * Copies horizontal and vertical edge state from source arrays into destination arrays.
 * Destinations must have the same dimensions as sources; used for solver backtracking without allocating.
 */
function copyState(
  srcH: EdgeState[][],
  srcV: EdgeState[][],
  dstH: EdgeState[][],
  dstV: EdgeState[][],
): void {
  for (let r = 0; r < srcH.length; r++) {
    for (let c = 0; c < srcH[r].length; c++) {
      dstH[r][c] = srcH[r][c];
    }
  }
  for (let r = 0; r < srcV.length; r++) {
    for (let c = 0; c < srcV[r].length; c++) {
      dstV[r][c] = srcV[r][c];
    }
  }
}

/**
 * Propagates constraints for cell (r, c): clue must equal the count of line edges on its border.
 * @returns false if the clue is violated, true otherwise (true does not mean state changed).
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

/**
 * Runs cell and dot propagation until no further deductions; returns false on contradiction.
 * Uses a single pass with change detection to avoid cloning state each round.
 */
function propagate(
  width: number,
  height: number,
  clues: (number | null)[][],
  hState: EdgeState[][],
  vState: EdgeState[][],
): boolean {
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const beforeTop = hState[r][c];
        const beforeRight = vState[r][c + 1];
        const beforeBottom = hState[r + 1][c];
        const beforeLeft = vState[r][c];
        if (!propagateCell(clues, hState, vState, r, c)) return false;
        if (
          beforeTop !== hState[r][c] ||
          beforeRight !== vState[r][c + 1] ||
          beforeBottom !== hState[r + 1][c] ||
          beforeLeft !== vState[r][c]
        ) {
          changed = true;
        }
      }
    }
    for (let row = 0; row <= height; row++) {
      for (let col = 0; col <= width; col++) {
        const before = getDotEdgeValues(hState, vState, width, height, row, col);
        if (!propagateDot(width, height, hState, vState, row, col)) return false;
        const after = getDotEdgeValues(hState, vState, width, height, row, col);
        if (before.some((v, i) => v !== after[i])) changed = true;
      }
    }
  }
  return true;
}

/** Returns the edge state values incident to dot (row, col), for change detection in propagate. */
function getDotEdgeValues(
  hState: EdgeState[][],
  vState: EdgeState[][],
  width: number,
  height: number,
  row: number,
  col: number,
): EdgeState[] {
  const out: EdgeState[] = [];
  if (col > 0) out.push(hState[row][col - 1]);
  if (col < width) out.push(hState[row][col]);
  if (row > 0) out.push(vState[row - 1][col]);
  if (row < height) out.push(vState[row][col]);
  return out;
}

/** Converts edge state arrays (-1/0/1) to solution format (boolean grids; -1 treated as false). */
function stateToSolution(hState: EdgeState[][], vState: EdgeState[][]): SlitherlinkSolution {
  return {
    horizontalEdges: hState.map((row) => row.map((v) => v === 1)),
    verticalEdges: vState.map((row) => row.map((v) => v === 1)),
  };
}

/**
 * Returns an unknown edge to branch on, or null if all assigned.
 * Prefers edges that touch cells with clue 0 or 4 (most constrained) to fail fast.
 */
function findFirstUnknown(
  width: number,
  height: number,
  clues: (number | null)[][],
  hState: EdgeState[][],
  vState: EdgeState[][],
): { type: 'H' | 'V'; r: number; c: number } | null {
  let best: { type: 'H' | 'V'; r: number; c: number; score: number } | null = null;

  function scoreEdge(type: 'H' | 'V', r: number, c: number): number {
    let s = 0;
    if (type === 'H') {
      // Horizontal edge (r,c): top of cell (r,c), bottom of cell (r-1,c)
      if (r < height) {
        const clue = clues[r][c];
        if (clue === 0 || clue === 4) s++;
      }
      if (r > 0) {
        const clue = clues[r - 1][c];
        if (clue === 0 || clue === 4) s++;
      }
    } else {
      // Vertical edge (r,c): left of cell (r,c), right of cell (r,c-1)
      if (c < width) {
        const clue = clues[r][c];
        if (clue === 0 || clue === 4) s++;
      }
      if (c > 0) {
        const clue = clues[r][c - 1];
        if (clue === 0 || clue === 4) s++;
      }
    }
    return s;
  }

  for (let r = 0; r < hState.length; r++) {
    for (let c = 0; c < hState[r].length; c++) {
      if (hState[r][c] === -1) {
        const score = scoreEdge('H', r, c);
        if (best === null || score > best.score) best = { type: 'H', r, c, score };
      }
    }
  }
  for (let r = 0; r < vState.length; r++) {
    for (let c = 0; c < vState[r].length; c++) {
      if (vState[r][c] === -1) {
        const score = scoreEdge('V', r, c);
        if (best === null || score > best.score) best = { type: 'V', r, c, score };
      }
    }
  }
  return best === null ? null : { type: best.type, r: best.r, c: best.c };
}

/**
 * Finds up to maxSolutions solutions to the Slitherlink puzzle with the given clues.
 * Uses constraint propagation and backtracking; only counts assignments that form a single loop.
 * Uses a reusable save buffer to avoid allocating on every branch.
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

  const hState: EdgeState[][] = Array.from(
    { length: height + 1 },
    () => Array<number>(width).fill(-1) as EdgeState[],
  );
  const vState: EdgeState[][] = Array.from(
    { length: height },
    () => Array<number>(width + 1).fill(-1) as EdgeState[],
  );
  const hStateSaved: EdgeState[][] = Array.from(
    { length: height + 1 },
    () => Array<number>(width).fill(-1) as EdgeState[],
  );
  const vStateSaved: EdgeState[][] = Array.from(
    { length: height },
    () => Array<number>(width + 1).fill(-1) as EdgeState[],
  );

  function solve(
    h: EdgeState[][],
    v: EdgeState[][],
    hSave: EdgeState[][],
    vSave: EdgeState[][],
  ): void {
    if (solutions.length >= maxSolutions) return;

    if (!propagate(width, height, clues, h, v)) return;

    const unknown = findFirstUnknown(width, height, clues, h, v);
    if (unknown === null) {
      const sol = stateToSolution(h, v);
      if (validateSingleLoop(width, height, sol.horizontalEdges, sol.verticalEdges)) {
        solutions.push(sol);
      }
      return;
    }

    const { type, r, c } = unknown;
    if (type === 'H') {
      copyState(h, v, hSave, vSave);
      h[r][c] = 0;
      solve(h, v, hSave, vSave);
      if (solutions.length >= maxSolutions) return;
      copyState(hSave, vSave, h, v);
      h[r][c] = 1;
      solve(h, v, hSave, vSave);
    } else {
      copyState(h, v, hSave, vSave);
      v[r][c] = 0;
      solve(h, v, hSave, vSave);
      if (solutions.length >= maxSolutions) return;
      copyState(hSave, vSave, h, v);
      v[r][c] = 1;
      solve(h, v, hSave, vSave);
    }
  }

  solve(hState, vState, hStateSaved, vStateSaved);
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

    if (!isLoopComplexEnough(width, height, horizontalEdges, verticalEdges)) continue;

    const fullClues = deriveClues(width, height, horizontalEdges, verticalEdges);

    const fullSolutions = findSlitherlinkSolutions(width, height, fullClues, 2);
    if (fullSolutions.length !== 1) continue;

    const clues = sparsifyClues(width, height, fullClues, attemptRandom);

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
