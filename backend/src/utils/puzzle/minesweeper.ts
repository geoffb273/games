import { type MinesweeperPuzzleData } from '@/platform/puzzle/resource/puzzle';

import { createSeededRandom, stringToSeed } from '../randomUtils';

type CellState = 'mine' | 'safe' | 'unknown';

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

function computeAdjacencyCounts(mines: boolean[][], width: number, height: number): number[][] {
  const counts: number[][] = Array.from({ length: height }, () => new Array<number>(width).fill(0));
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (mines[r][c]) continue;
      let count = 0;
      for (const n of getNeighbors(r, c, width, height)) {
        if (mines[n.row][n.col]) count++;
      }
      counts[r][c] = count;
    }
  }
  return counts;
}

// --- Solver ---

/**
 * Constraint propagation using only the fixed set of revealed cell values.
 * Does NOT reveal newly-deduced safe cells — their adjacency values are unknown
 * to the player and depend on the (possibly hypothetical) mine configuration.
 */
function propagateConstraints(
  state: CellState[][],
  constraints: Map<string, number>,
  width: number,
  height: number,
): boolean {
  let changed = false;

  for (const [key, value] of constraints) {
    const [r, c] = key.split(',').map(Number);

    const neighbors = getNeighbors(r, c, width, height);
    let mineCount = 0;
    let unknownCount = 0;
    const unknowns: { row: number; col: number }[] = [];

    for (const n of neighbors) {
      if (state[n.row][n.col] === 'mine') mineCount++;
      else if (state[n.row][n.col] === 'unknown') {
        unknownCount++;
        unknowns.push(n);
      }
    }

    if (mineCount === value) {
      for (const n of unknowns) {
        state[n.row][n.col] = 'safe';
        changed = true;
      }
    } else if (mineCount + unknownCount === value) {
      for (const n of unknowns) {
        state[n.row][n.col] = 'mine';
        changed = true;
      }
    }
  }

  return changed;
}

/**
 * Checks whether the current state is consistent with all constraint cells.
 */
function isConsistent(
  state: CellState[][],
  constraints: Map<string, number>,
  width: number,
  height: number,
): boolean {
  for (const [key, value] of constraints) {
    const [r, c] = key.split(',').map(Number);
    const neighbors = getNeighbors(r, c, width, height);

    let mineCount = 0;
    let unknownCount = 0;

    for (const n of neighbors) {
      if (state[n.row][n.col] === 'mine') mineCount++;
      else if (state[n.row][n.col] === 'unknown') unknownCount++;
    }

    if (mineCount > value) return false;
    if (mineCount + unknownCount < value) return false;
  }

  return true;
}

function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map((row) => [...row]);
}

/**
 * Counts solutions using constraint propagation + backtracking.
 * Stops early once maxSolutions is reached.
 */
function countSolutions(
  state: CellState[][],
  constraints: Map<string, number>,
  width: number,
  height: number,
  totalMines: number,
  maxSolutions: number,
): number {
  const s = cloneGrid(state);

  let propagated = true;
  while (propagated) {
    propagated = propagateConstraints(s, constraints, width, height);
  }

  if (!isConsistent(s, constraints, width, height)) return 0;

  let mineCount = 0;
  const unknowns: { row: number; col: number }[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (s[r][c] === 'mine') mineCount++;
      else if (s[r][c] === 'unknown') unknowns.push({ row: r, col: c });
    }
  }

  if (mineCount > totalMines) return 0;
  if (unknowns.length === 0) {
    return mineCount === totalMines ? 1 : 0;
  }

  const minesLeft = totalMines - mineCount;
  if (minesLeft > unknowns.length) return 0;

  if (minesLeft === 0) {
    for (const u of unknowns) {
      s[u.row][u.col] = 'safe';
    }
    return isConsistent(s, constraints, width, height) ? 1 : 0;
  }

  if (minesLeft === unknowns.length) {
    for (const u of unknowns) {
      s[u.row][u.col] = 'mine';
    }
    return isConsistent(s, constraints, width, height) ? 1 : 0;
  }

  // Pick the unknown cell most constrained by revealed neighbors (MRV)
  let bestIdx = 0;
  let bestConstraint = -1;
  for (let i = 0; i < unknowns.length; i++) {
    const u = unknowns[i];
    let constraint = 0;
    for (const n of getNeighbors(u.row, u.col, width, height)) {
      if (constraints.has(`${n.row},${n.col}`)) constraint++;
    }
    if (constraint > bestConstraint) {
      bestConstraint = constraint;
      bestIdx = i;
    }
  }

  const cell = unknowns[bestIdx];
  let total = 0;

  const sMine = cloneGrid(s);
  sMine[cell.row][cell.col] = 'mine';
  total += countSolutions(sMine, constraints, width, height, totalMines, maxSolutions);
  if (total >= maxSolutions) return total;

  const sSafe = cloneGrid(s);
  sSafe[cell.row][cell.col] = 'safe';
  total += countSolutions(sSafe, constraints, width, height, totalMines, maxSolutions - total);

  return total;
}

/**
 * Determines if a Minesweeper puzzle has exactly one solution given the revealed cells.
 *
 * Uses constraint propagation on revealed cell values plus the total mine count,
 * with backtracking (MRV heuristic) for undetermined cells.
 */
export function solveMinesweeper(
  mines: boolean[][],
  revealedCells: { row: number; col: number; value: number }[],
  width: number,
  height: number,
  mineCount: number,
): { solvable: boolean } {
  const state: CellState[][] = Array.from({ length: height }, () =>
    new Array<CellState>(width).fill('unknown'),
  );
  const constraints = new Map<string, number>();

  for (const cell of revealedCells) {
    state[cell.row][cell.col] = 'safe';
    constraints.set(`${cell.row},${cell.col}`, cell.value);
  }

  const solutions = countSolutions(state, constraints, width, height, mineCount, 2);
  return { solvable: solutions === 1 };
}

// --- Generation helpers ---

function shuffleArray<T>(arr: T[], random: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function placeMines(
  width: number,
  height: number,
  mineCount: number,
  random: () => number,
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: height }, () =>
    new Array<boolean>(width).fill(false),
  );

  const positions: { row: number; col: number }[] = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      positions.push({ row: r, col: c });
    }
  }

  const shuffled = shuffleArray(positions, random);
  for (let i = 0; i < mineCount; i++) {
    grid[shuffled[i].row][shuffled[i].col] = true;
  }

  return grid;
}

/**
 * Flood-fills from a starting "0" cell, revealing it and all
 * contiguous zero-valued cells plus their numbered border.
 */
function floodFillReveal(
  start: { row: number; col: number },
  adjacency: number[][],
  mines: boolean[][],
  width: number,
  height: number,
): Set<string> {
  const revealed = new Set<string>();
  const queue = [start];
  const key = (r: number, c: number) => `${r},${c}`;

  revealed.add(key(start.row, start.col));

  while (queue.length > 0) {
    const cell = queue.shift()!;

    if (adjacency[cell.row][cell.col] !== 0) continue;

    for (const n of getNeighbors(cell.row, cell.col, width, height)) {
      if (mines[n.row][n.col]) continue;
      const k = key(n.row, n.col);
      if (revealed.has(k)) continue;
      revealed.add(k);
      if (adjacency[n.row][n.col] === 0) {
        queue.push(n);
      }
    }
  }

  return revealed;
}

/**
 * Selects revealed cells: flood-fill from a random "0" cell,
 * then add random frontier cells until ~25-35% of safe cells are revealed.
 */
function selectRevealedCells(
  mines: boolean[][],
  adjacency: number[][],
  width: number,
  height: number,
  random: () => number,
): { row: number; col: number; value: number }[] | null {
  const safeCells: { row: number; col: number }[] = [];
  const zeroCells: { row: number; col: number }[] = [];

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (!mines[r][c]) {
        safeCells.push({ row: r, col: c });
        if (adjacency[r][c] === 0) {
          zeroCells.push({ row: r, col: c });
        }
      }
    }
  }

  if (zeroCells.length === 0) return null;

  const totalSafe = safeCells.length;
  const targetMin = Math.floor(totalSafe * 0.25);
  const targetMax = Math.floor(totalSafe * 0.35);

  const startCell = zeroCells[Math.floor(random() * zeroCells.length)];
  const revealedKeys = floodFillReveal(startCell, adjacency, mines, width, height);

  if (revealedKeys.size >= targetMax) {
    const cells: { row: number; col: number; value: number }[] = [];
    for (const k of revealedKeys) {
      const [r, c] = k.split(',').map(Number);
      cells.push({ row: r, col: c, value: adjacency[r][c] });
    }
    return cells;
  }

  const unrevealed = safeCells.filter((cell) => !revealedKeys.has(`${cell.row},${cell.col}`));
  const shuffled = shuffleArray(unrevealed, random);

  const target = targetMin + Math.floor(random() * (targetMax - targetMin + 1));
  for (const cell of shuffled) {
    if (revealedKeys.size >= target) break;
    revealedKeys.add(`${cell.row},${cell.col}`);
  }

  const cells: { row: number; col: number; value: number }[] = [];
  for (const k of revealedKeys) {
    const [r, c] = k.split(',').map(Number);
    cells.push({ row: r, col: c, value: adjacency[r][c] });
  }
  return cells;
}

// --- Main export ---

type GenerateMinesweeperPuzzleDataOptions = {
  width: number;
  height: number;
  mineCount: number;
  /** Optional seed for reproducibility */
  seed?: string | number;
};

const MAX_GENERATION_ATTEMPTS = 200;

/**
 * Generates Minesweeper puzzle data guaranteed to have a unique solution
 * solvable through pure logic (no guessing).
 *
 * Places mines randomly, computes adjacency numbers, selects an initial
 * set of revealed cells (~25-35% of safe cells via flood-fill + extras),
 * then verifies unique solvability with a constraint-propagation + backtracking solver.
 */
export function generateMinesweeperPuzzleData({
  width,
  height,
  mineCount,
  seed,
}: GenerateMinesweeperPuzzleDataOptions): MinesweeperPuzzleData {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const effectiveSeed = `${seed ?? Date.now()}-${attempt}`;
    const numericSeed = stringToSeed(effectiveSeed);
    const random = createSeededRandom(numericSeed);

    const mines = placeMines(width, height, mineCount, random);
    const adjacency = computeAdjacencyCounts(mines, width, height);

    const revealedCells = selectRevealedCells(mines, adjacency, width, height, random);
    if (revealedCells === null) continue;

    const result = solveMinesweeper(mines, revealedCells, width, height, mineCount);
    if (result.solvable) {
      return {
        width,
        height,
        mineCount,
        revealedCells,
        solution: mines,
      };
    }
  }

  throw new Error(
    `Failed to generate a uniquely solvable Minesweeper puzzle after ${MAX_GENERATION_ATTEMPTS} attempts`,
  );
}
