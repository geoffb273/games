import { createSeededRandom, stringToSeed } from '../randomUtils';

const MIN_PATH_LENGTH = 3;
const MIN_WALK_STEPS = 2; // steps = moves; 2 steps => 3 cells
const MAX_WALK_STEPS = 10;
const MAX_GENERATION_ATTEMPTS = 80;
const MAX_PATH_RETRIES = 80;

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
  numPairs?: number;
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
 * Places one path by random walk from a random empty cell. Marks cells with pathId.
 * Returns the path cells (first and last are endpoints) or null if failed.
 */
function placePathByRandomWalk(
  width: number,
  height: number,
  grid: number[][],
  pathId: number,
  random: () => number,
  emptyBuffer: Cell[],
): Cell[] | null {
  collectEmptyCellsInto(width, height, grid, emptyBuffer);
  if (emptyBuffer.length < MIN_PATH_LENGTH) return null;

  const path: Cell[] = [];
  const steps = MIN_WALK_STEPS + Math.floor(random() * (MAX_WALK_STEPS - MIN_WALK_STEPS + 1));

  for (let tries = 0; tries < emptyBuffer.length; tries++) {
    const idx = Math.floor(random() * emptyBuffer.length);
    const start = emptyBuffer[idx];
    path.length = 0;
    path.push({ row: start.row, col: start.col });
    grid[start.row][start.col] = pathId;

    let currentRow = start.row;
    let currentCol = start.col;

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
      if (count === 0) break;
      path.push({ row: nr!, col: nc! });
      grid[nr!][nc!] = pathId;
      currentRow = nr!;
      currentCol = nc!;
    }

    if (path.length >= MIN_PATH_LENGTH) return path.map((c) => ({ row: c.row, col: c.col }));
    for (const c of path) grid[c.row][c.col] = 0;
  }
  return null;
}

const OPT_R = 0;
const OPT_C = 1;
const OPT_T = 2;

/**
 * Finds up to maxSolutions solutions. Uses one grid buffer; forced moves are
 * applied in a tight loop (no recursion) so we only branch when necessary.
 * Exported for tests.
 */
export function findFlowSolutions(
  width: number,
  height: number,
  pairs: FlowPair[],
  maxSolutions: number,
): number[][][] {
  const solutions: number[][][] = [];
  const grid = Array.from({ length: height }, () => Array<number>(width).fill(0));

  function isOtherEndpoint(row: number, col: number, excludePairIndex: number): boolean {
    for (let i = 0; i < pairs.length; i++) {
      if (i === excludePairIndex) continue;
      const [a, b] = pairs[i].ends;
      if ((a.row === row && a.col === col) || (b.row === row && b.col === col)) return true;
    }
    return false;
  }

  /** Writes options into buf: [r0,c0,t0, r1,c1,t1, ...], returns count. */
  function getValidNextCount(
    pairIndex: number,
    currentRow: number,
    currentCol: number,
    buf: number[],
  ): number {
    if (pairIndex >= pairs.length) return 0;
    const pair = pairs[pairIndex];
    const target = pair.ends[1];
    let n = 0;
    for (const [dr, dc] of CARDINAL) {
      const r = currentRow + dr;
      const c = currentCol + dc;
      if (r < 0 || r >= height || c < 0 || c >= width) continue;
      if (isOtherEndpoint(r, c, pairIndex)) continue;
      const g = grid[r][c];
      const isTarget = r === target.row && c === target.col ? 1 : 0;
      if (isTarget || g === 0) {
        buf[n * 3 + OPT_R] = r;
        buf[n * 3 + OPT_C] = c;
        buf[n * 3 + OPT_T] = isTarget;
        n++;
        if (n >= 4) break;
      }
    }
    return n;
  }

  const optBuf: number[] = new Array(4 * 3);

  function solve(pairIndex: number, currentRow: number, currentCol: number): void {
    if (solutions.length >= maxSolutions) return;

    const pi = pairIndex;
    let r = currentRow;
    let c = currentCol;

    for (;;) {
      if (pi >= pairs.length) {
        solutions.push(grid.map((row) => row.slice()));
        return;
      }

      const id = pairs[pi].number;
      const cnt = getValidNextCount(pi, r, c, optBuf);
      if (cnt === 0) return;

      if (cnt === 1) {
        const nr = optBuf[OPT_R];
        const nc = optBuf[OPT_C];
        const isTarget = optBuf[OPT_T];
        if (isTarget) {
          if (grid[nr][nc] === 0) {
            grid[nr][nc] = id;
            if (pi + 1 < pairs.length) {
              const nextPair = pairs[pi + 1];
              const nextStart = nextPair.ends[0];
              grid[nextStart.row][nextStart.col] = nextPair.number;
              solve(pi + 1, nextStart.row, nextStart.col);
              grid[nextStart.row][nextStart.col] = 0;
            } else {
              solve(pi + 1, nr, nc);
            }
            grid[nr][nc] = 0;
            return;
          }
          if (pi + 1 < pairs.length) {
            const nextPair = pairs[pi + 1];
            const nextStart = nextPair.ends[0];
            grid[nextStart.row][nextStart.col] = nextPair.number;
            solve(pi + 1, nextStart.row, nextStart.col);
            grid[nextStart.row][nextStart.col] = 0;
          } else {
            solve(pi + 1, nr, nc);
          }
          return;
        }
        grid[nr][nc] = id;
        r = nr;
        c = nc;
        continue;
      }

      for (let i = 0; i < cnt; i++) {
        const nr = optBuf[i * 3 + OPT_R];
        const nc = optBuf[i * 3 + OPT_C];
        const isTarget = optBuf[i * 3 + OPT_T];
        if (isTarget) {
          if (grid[nr][nc] === 0) {
            grid[nr][nc] = id;
            if (pi + 1 < pairs.length) {
              const nextPair = pairs[pi + 1];
              const nextStart = nextPair.ends[0];
              grid[nextStart.row][nextStart.col] = nextPair.number;
              solve(pi + 1, nextStart.row, nextStart.col);
              grid[nextStart.row][nextStart.col] = 0;
            } else {
              solve(pi + 1, nr, nc);
            }
            grid[nr][nc] = 0;
          } else {
            if (pi + 1 < pairs.length) {
              const nextPair = pairs[pi + 1];
              const nextStart = nextPair.ends[0];
              grid[nextStart.row][nextStart.col] = nextPair.number;
              solve(pi + 1, nextStart.row, nextStart.col);
              grid[nextStart.row][nextStart.col] = 0;
            } else {
              solve(pi + 1, nr, nc);
            }
          }
        } else {
          grid[nr][nc] = id;
          solve(pi, nr, nc);
          grid[nr][nc] = 0;
        }
      }
      return;
    }
  }

  if (pairs.length === 0) {
    if (maxSolutions > 0) solutions.push(grid.map((row) => row.slice()));
    return solutions;
  }

  const first = pairs[0].ends[0];
  grid[first.row][first.col] = pairs[0].number;
  solve(0, first.row, first.col);
  grid[first.row][first.col] = 0;

  return solutions;
}

export function generateFlowPuzzleData({
  width,
  height,
  numPairs: numPairsOpt,
  seed,
}: GenerateFlowPuzzleDataOptions): FlowPuzzleData {
  const numPairs = numPairsOpt ?? 4;
  const baseSeed = `${seed ?? Date.now()}`;

  const emptyBuffer: Cell[] = [];

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const attemptSeed = `${baseSeed}-a${attempt}`;
    const numericSeed = stringToSeed(attemptSeed);
    const random = createSeededRandom(numericSeed);

    const grid = Array.from({ length: height }, () => Array<number>(width).fill(0));
    const pathCells: Cell[][] = [];

    let ok = true;
    for (let pathId = 1; pathId <= numPairs; pathId++) {
      let placed = false;
      for (let retry = 0; retry < MAX_PATH_RETRIES; retry++) {
        const path = placePathByRandomWalk(width, height, grid, pathId, random, emptyBuffer);
        if (path) {
          pathCells.push(path);
          placed = true;
          break;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }

    if (!ok) continue;

    const pairs: FlowPair[] = pathCells.map((cells, i) => ({
      number: i + 1,
      ends: [cells[0], cells[cells.length - 1]],
    }));

    const solutions = findFlowSolutions(width, height, pairs, 2);
    if (solutions.length !== 1) continue;

    const solution = grid.map((row) => row.slice());
    return { width, height, pairs, solution };
  }

  throw new Error(
    `Failed to generate a uniquely solvable Flow puzzle for grid ${width}x${height} with ${numPairs} pairs after ${MAX_GENERATION_ATTEMPTS} attempts`,
  );
}

export function isUniqueFlowSolution(width: number, height: number, pairs: FlowPair[]): boolean {
  if (pairs.length === 0) return false;
  const solutions = findFlowSolutions(width, height, pairs, 2);
  return solutions.length === 1;
}
