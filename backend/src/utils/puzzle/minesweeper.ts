import { type MinesweeperPuzzleData } from '@/platform/puzzle/resource/puzzle';

import { createSeededRandom, shuffleArray, stringToSeed } from '../randomUtils';

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

export const MINESWEEPER_CELL_VALUES = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  'MINE',
] as const;

export type MinesweeperCellValue = (typeof MINESWEEPER_CELL_VALUES)[number];

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

export function computeAdjacencyCounts(
  mines: boolean[][],
  width: number,
  height: number,
): number[][] {
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

export function computeSolutionCells(
  mines: boolean[][],
  width: number,
  height: number,
): MinesweeperCellValue[][] {
  const adjacency = computeAdjacencyCounts(mines, width, height);

  return Array.from<undefined, MinesweeperCellValue[]>({ length: height }, (_rowIndex, row) => {
    return Array.from<undefined, MinesweeperCellValue>({ length: width }, (_colIndex, col) => {
      return mines[row][col]
        ? ('MINE' as const)
        : (String(adjacency[row][col]) as MinesweeperCellValue);
    });
  });
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
 * Checks if a puzzle is solvable by iterative constraint propagation with
 * progressive reveal — matching actual gameplay where clicking a safe cell
 * reveals its adjacency number. If propagation alone resolves every cell,
 * uniqueness is guaranteed (each step is a forced deduction).
 */
export function isSolvableByPropagation(
  adjacency: number[][],
  revealedCells: { row: number; col: number; value: number }[],
  width: number,
  height: number,
  mineCount: number,
): boolean {
  const state: CellState[][] = Array.from({ length: height }, () =>
    new Array<CellState>(width).fill('unknown'),
  );
  const constraints = new Map<string, number>();

  for (const cell of revealedCells) {
    state[cell.row][cell.col] = 'safe';
    constraints.set(`${cell.row},${cell.col}`, cell.value);
  }

  let changed = true;
  while (changed) {
    changed = propagateConstraints(state, constraints, width, height);

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const key = `${r},${c}`;
        if (state[r][c] === 'safe' && !constraints.has(key)) {
          constraints.set(key, adjacency[r][c]);
          changed = true;
        }
      }
    }

    let mines = 0;
    let unknownCount = 0;
    const unknowns: { row: number; col: number }[] = [];
    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        if (state[r][c] === 'mine') mines++;
        else if (state[r][c] === 'unknown') {
          unknownCount++;
          unknowns.push({ row: r, col: c });
        }
      }
    }

    if (mines === mineCount && unknownCount > 0) {
      for (const u of unknowns) {
        state[u.row][u.col] = 'safe';
      }
      changed = true;
    } else if (mines + unknownCount === mineCount && unknownCount > 0) {
      for (const u of unknowns) {
        state[u.row][u.col] = 'mine';
      }
      changed = true;
    }
  }

  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (state[r][c] === 'unknown') return false;
    }
  }
  return true;
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
  const targetMax = Math.floor(totalSafe * 0.4);

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

const MAX_LAYOUT_ATTEMPTS = 50;
const REVEAL_ATTEMPTS_PER_LAYOUT = 10;

/**
 * Generates Minesweeper puzzle data guaranteed to have a unique solution
 * solvable through pure logic (no guessing).
 *
 * Places mines randomly, computes adjacency numbers, then tries multiple
 * reveal sets per layout (~25-40% of safe cells via flood-fill + extras)
 * and verifies solvability via iterative constraint propagation with
 * progressive reveal (matching actual gameplay).
 */
export function generateMinesweeperPuzzleData({
  width,
  height,
  mineCount,
  seed,
}: GenerateMinesweeperPuzzleDataOptions): MinesweeperPuzzleData {
  for (let layout = 0; layout < MAX_LAYOUT_ATTEMPTS; layout++) {
    const layoutSeed = `${seed ?? Date.now()}-${layout}`;
    const layoutNumericSeed = stringToSeed(layoutSeed);
    const layoutRandom = createSeededRandom(layoutNumericSeed);

    const mines = placeMines(width, height, mineCount, layoutRandom);
    const adjacency = computeAdjacencyCounts(mines, width, height);

    for (let reveal = 0; reveal < REVEAL_ATTEMPTS_PER_LAYOUT; reveal++) {
      const revealSeed = `${layoutSeed}-r${reveal}`;
      const revealNumericSeed = stringToSeed(revealSeed);
      const revealRandom = createSeededRandom(revealNumericSeed);

      const revealedCells = selectRevealedCells(mines, adjacency, width, height, revealRandom);
      if (revealedCells === null) continue;

      if (isSolvableByPropagation(adjacency, revealedCells, width, height, mineCount)) {
        return {
          width,
          height,
          mineCount,
          revealedCells,
          solution: mines,
        };
      }
    }
  }

  throw new Error(
    `Failed to generate a uniquely solvable Minesweeper puzzle after ${MAX_LAYOUT_ATTEMPTS * REVEAL_ATTEMPTS_PER_LAYOUT} attempts`,
  );
}
