import { createSeededRandom, stringToSeed } from '../randomUtils';

const MIN_PATH_LENGTH = 6; // each path must have at least 6 cells
const MIN_WALK_STEPS = 5; // steps = moves; 5 steps => 6 cells
const MIN_GRID_AREA = 17; // area must be greater than 4x4 (16 cells)
const MIN_DIMENSION = 4; // width and height must each be at least 4
const MAX_GENERATION_ATTEMPTS = 80;
const MAX_PATH_RETRIES = 80;

/** Max path length in cells: at most one-sixth of the grid. */
function getMaxPathLength(totalCells: number): number {
  return Math.max(MIN_PATH_LENGTH, Math.floor(totalCells / 6));
}

type Cell = { row: number; col: number };

export type FlowPair = {
  number: number;
  ends: [Cell, Cell];
};

export type FlowPuzzleData = {
  width: number;
  height: number;
  pairs: FlowPair[];
  solution: number[][];
};

type GenerateFlowPuzzleDataOptions = {
  width: number;
  height: number;
  seed?: string | number;
};

const CARDINAL: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

/** Reusable buffer for empty cell indices to avoid allocations in hot path. */
function collectEmptyCellsInto(width: number, height: number, grid: number[][], out: Cell[]): void {
  out.length = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === 0) out.push({ row: r, col: c });
    }
  }
}

/**
 * Returns true if all empty (zero) cells in the grid form a single connected component.
 */
function areEmptyCellsConnected(width: number, height: number, grid: number[][]): boolean {
  let first: Cell | null = null;
  let emptyCount = 0;
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === 0) {
        emptyCount++;
        if (first === null) first = { row: r, col: c };
      }
    }
  }
  if (emptyCount === 0) return true;
  if (first === null) return true;

  const visited = new Set<string>();
  const key = (row: number, col: number) => `${row},${col}`;
  const queue: Cell[] = [first];
  visited.add(key(first.row, first.col));
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    for (const [dr, dc] of CARDINAL) {
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < height && c >= 0 && c < width && grid[r][c] === 0) {
        const k = key(r, c);
        if (!visited.has(k)) {
          visited.add(k);
          queue.push({ row: r, col: c });
        }
      }
    }
  }
  return visited.size === emptyCount;
}

/**
 * Next path length so we fill the grid: either finish (remaining) or random in [MIN_PATH_LENGTH, max]
 * leaving at least MIN_PATH_LENGTH for future paths (or 0).
 */
function computeNextTargetLength(
  remaining: number,
  maxPathLength: number,
  random: () => number,
): number {
  if (remaining <= maxPathLength) return remaining;
  const maxForThisPath = Math.min(maxPathLength, remaining - MIN_PATH_LENGTH);
  const min = MIN_PATH_LENGTH;
  return min + Math.floor(random() * (maxForThisPath - min + 1));
}

/**
 * Places one path by random walk from a random empty cell. Marks cells with pathId.
 * If targetLength is set, the path must have exactly that many cells; otherwise length is random in [MIN_PATH_LENGTH, max].
 * Returns the path cells (first and last are endpoints) or null if failed.
 */
function placePathByRandomWalk(
  width: number,
  height: number,
  grid: number[][],
  pathId: number,
  random: () => number,
  emptyBuffer: Cell[],
  targetLength?: number,
): Cell[] | null {
  collectEmptyCellsInto(width, height, grid, emptyBuffer);
  const minCells = targetLength ?? MIN_PATH_LENGTH;
  if (emptyBuffer.length < minCells) return null;

  const path: Cell[] = [];
  const maxCells = targetLength !== undefined ? targetLength : getMaxPathLength(emptyBuffer.length);
  const steps =
    targetLength !== undefined
      ? targetLength - 1
      : MIN_WALK_STEPS +
        Math.floor(random() * (Math.min(maxCells, emptyBuffer.length) - MIN_PATH_LENGTH + 1));

  for (let tries = 0; tries < emptyBuffer.length; tries++) {
    const idx = Math.floor(random() * emptyBuffer.length);
    const start = emptyBuffer[idx];
    path.length = 0;
    path.push({ row: start.row, col: start.col });
    grid[start.row][start.col] = pathId;

    let currentRow = start.row;
    let currentCol = start.col;
    let stuck = false;

    for (let s = 0; s < steps; s++) {
      let count = 0;
      let nr = -1;
      let nc = -1;
      for (const [dr, dc] of CARDINAL) {
        const r = currentRow + dr;
        const c = currentCol + dc;
        if (r >= 0 && r < height && c >= 0 && c < width && grid[r][c] === 0) {
          count++;
          if (count === 1) {
            nr = r;
            nc = c;
          } else if (random() < 1 / count) {
            nr = r;
            nc = c;
          }
        }
      }
      if (count === 0) {
        stuck = true;
        break;
      }
      path.push({ row: nr!, col: nc! });
      grid[nr!][nc!] = pathId;
      currentRow = nr!;
      currentCol = nc!;
    }

    const ok =
      targetLength !== undefined
        ? !stuck && path.length === targetLength
        : path.length >= MIN_PATH_LENGTH;
    if (ok) return path.map((c) => ({ row: c.row, col: c.col }));
    for (const c of path) grid[c.row][c.col] = 0;
  }
  return null;
}

/**
 * Returns true if the given grid is a valid solution for the puzzle:
 * dimensions match, grid is full (no zeros), each pair's endpoints are correct,
 * and each pair's cells form a single path connecting its endpoints.
 */
export function isValidFlowSolution(
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
    const queue: Cell[] = [{ row: a.row, col: a.col }];
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

export function generateFlowPuzzleData({
  width,
  height,
  seed,
}: GenerateFlowPuzzleDataOptions): FlowPuzzleData {
  const baseSeed = `${seed ?? Date.now()}`;
  if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
    throw new Error(
      `Grid ${width}x${height} invalid; width and height must each be ${MIN_DIMENSION} or greater`,
    );
  }
  const totalCells = width * height;
  if (totalCells <= MIN_GRID_AREA - 1) {
    throw new Error(
      `Grid ${width}x${height} has area ${totalCells}; area must be greater than 4x4 (${MIN_GRID_AREA - 1} cells)`,
    );
  }
  if (totalCells < MIN_PATH_LENGTH) {
    throw new Error(
      `Grid ${width}x${height} has ${totalCells} cells; need at least ${MIN_PATH_LENGTH} to place a path`,
    );
  }
  const maxPathLength = getMaxPathLength(totalCells);

  const emptyBuffer: Cell[] = [];

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const attemptSeed = `${baseSeed}-a${attempt}`;
    const numericSeed = stringToSeed(attemptSeed);
    const random = createSeededRandom(numericSeed);

    const grid = Array.from({ length: height }, () => Array<number>(width).fill(0));
    const pathCells: Cell[][] = [];
    let remaining = totalCells;
    let pathId = 1;

    while (remaining > 0) {
      const targetLength = computeNextTargetLength(remaining, maxPathLength, random);
      let placed = false;
      for (let retry = 0; retry < MAX_PATH_RETRIES; retry++) {
        const path = placePathByRandomWalk(
          width,
          height,
          grid,
          pathId,
          random,
          emptyBuffer,
          targetLength,
        );
        if (path) {
          if (remaining > targetLength && !areEmptyCellsConnected(width, height, grid)) {
            for (const c of path) grid[c.row][c.col] = 0;
            continue;
          }
          pathCells.push(path);
          remaining -= targetLength;
          pathId++;
          placed = true;
          break;
        }
      }
      if (!placed) break;
    }

    if (remaining !== 0) continue;

    const pairs: FlowPair[] = pathCells.map((cells, i) => ({
      number: i + 1,
      ends: [cells[0], cells[cells.length - 1]],
    }));

    const solution = grid.map((row) => row.slice());
    return { width, height, pairs, solution };
  }

  throw new Error(
    `Failed to generate a Flow puzzle for grid ${width}x${height} after ${MAX_GENERATION_ATTEMPTS} attempts`,
  );
}
