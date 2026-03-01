import { type HanjiPuzzleData } from '@/platform/puzzle/resource/puzzle';

import { createSeededRandom, stringToSeed } from '../randomUtils';

type CellState = 0 | 1 | -1;

/**
 * Finds the leftmost valid placement of all clue blocks in a line,
 * respecting already-known cell states.
 *
 * Returns an array of start positions (one per block), or null if no valid placement exists.
 */
function findLeftmostPlacement(
  clues: number[],
  known: CellState[],
  length: number,
): number[] | null {
  if (clues.length === 0) {
    return known.some((c) => c === 1) ? null : [];
  }
  return placeBlockLeft(0, 0, clues, known, length);
}

function placeBlockLeft(
  blockIdx: number,
  minPos: number,
  clues: number[],
  known: CellState[],
  length: number,
): number[] | null {
  if (blockIdx >= clues.length) {
    for (let p = minPos; p < length; p++) {
      if (known[p] === 1) return null;
    }
    return [];
  }

  const blockSize = clues[blockIdx];

  for (let pos = minPos; pos <= length - blockSize; pos++) {
    if (pos > minPos && known[pos - 1] === 1) {
      return null;
    }

    let blockValid = true;
    for (let p = pos; p < pos + blockSize; p++) {
      if (known[p] === 0) {
        blockValid = false;
        break;
      }
    }
    if (!blockValid) continue;

    const afterBlock = pos + blockSize;
    if (afterBlock < length && known[afterBlock] === 1) continue;

    const rest = placeBlockLeft(blockIdx + 1, afterBlock + 1, clues, known, length);
    if (rest !== null) {
      return [pos, ...rest];
    }
  }

  return null;
}

/**
 * Finds the rightmost valid placement by reversing the line,
 * finding leftmost in the reversed space, then mapping back.
 */
function findRightmostPlacement(
  clues: number[],
  known: CellState[],
  length: number,
): number[] | null {
  const reversedClues = [...clues].reverse();
  const reversedKnown = [...known].reverse();

  const result = findLeftmostPlacement(reversedClues, reversedKnown, length);
  if (result === null) return null;

  const rightStarts: number[] = [];
  for (let i = result.length - 1; i >= 0; i--) {
    rightStarts.push(length - result[i] - reversedClues[i]);
  }

  return rightStarts;
}

/**
 * Resolves a single line (row or column) given its clues and current known cell states.
 *
 * Uses the leftmost/rightmost placement algorithm:
 * 1. Find where each block sits in the leftmost valid arrangement
 * 2. Find where each block sits in the rightmost valid arrangement
 * 3. Cells in the overlap of every block's range are definitely filled
 * 4. Cells outside every block's reachable range are definitely empty
 */
export function solveLine(clues: number[], known: CellState[], length: number): CellState[] {
  const result: CellState[] = [...known];

  if (clues.length === 0) {
    return result.map(() => 0 as CellState);
  }

  const left = findLeftmostPlacement(clues, known, length);
  const right = findRightmostPlacement(clues, known, length);

  if (left === null || right === null) {
    return result;
  }

  for (let i = 0; i < clues.length; i++) {
    const overlapStart = right[i];
    const overlapEnd = left[i] + clues[i] - 1;
    for (let p = overlapStart; p <= overlapEnd; p++) {
      if (result[p] === -1) result[p] = 1;
    }
  }

  for (let p = 0; p < length; p++) {
    if (result[p] !== -1) continue;

    let canBeCovered = false;
    for (let i = 0; i < clues.length; i++) {
      if (p >= left[i] && p <= right[i] + clues[i] - 1) {
        canBeCovered = true;
        break;
      }
    }
    if (!canBeCovered) {
      result[p] = 0;
    }
  }

  return result;
}

/**
 * Attempts to fully solve a nonogram using only line-by-line constraint propagation.
 *
 * If every cell is resolved, the puzzle is guaranteed to have a unique solution.
 * If the solver stalls with unknown cells remaining, the puzzle may be ambiguous.
 */
export function isLineSolvable(
  rowClues: number[][],
  colClues: number[][],
  width: number,
  height: number,
): { solvable: boolean; solution?: (0 | 1)[][] } {
  const grid: CellState[][] = Array.from({ length: height }, () =>
    new Array<CellState>(width).fill(-1),
  );

  let changed = true;
  while (changed) {
    changed = false;

    for (let r = 0; r < height; r++) {
      const row = grid[r];
      const newRow = solveLine(rowClues[r], row, width);
      for (let c = 0; c < width; c++) {
        if (row[c] === -1 && newRow[c] !== -1) {
          row[c] = newRow[c];
          changed = true;
        }
      }
    }

    for (let c = 0; c < width; c++) {
      const col: CellState[] = [];
      for (let r = 0; r < height; r++) {
        col.push(grid[r][c]);
      }
      const newCol = solveLine(colClues[c], col, height);
      for (let r = 0; r < height; r++) {
        if (grid[r][c] === -1 && newCol[r] !== -1) {
          grid[r][c] = newCol[r];
          changed = true;
        }
      }
    }
  }

  const allResolved = grid.every((row) => row.every((cell) => cell !== -1));
  if (allResolved) {
    return { solvable: true, solution: grid as (0 | 1)[][] };
  }

  return { solvable: false };
}

/**
 * Derives row clues from a solution grid.
 * Each row's clues are the lengths of consecutive runs of filled cells (1s).
 */
function getRowClues(solution: number[][]): number[][] {
  return solution.map((row) => {
    const clues: number[] = [];
    let run = 0;
    for (const cell of row) {
      if (cell === 1) {
        run++;
      } else if (run > 0) {
        clues.push(run);
        run = 0;
      }
    }
    if (run > 0) clues.push(run);
    return clues;
  });
}

/**
 * Derives column clues from a solution grid.
 * Each column's clues are the lengths of consecutive runs of filled cells (1s).
 */
function getColClues(solution: number[][]): number[][] {
  if (solution.length === 0) return [];
  const width = solution[0].length;
  const clues: number[][] = [];
  for (let c = 0; c < width; c++) {
    const colClues: number[] = [];
    let run = 0;
    for (let r = 0; r < solution.length; r++) {
      const cell = solution[r][c];
      if (cell === 1) {
        run++;
      } else if (run > 0) {
        colClues.push(run);
        run = 0;
      }
    }
    if (run > 0) colClues.push(run);
    clues.push(colClues);
  }
  return clues;
}

type GenerateHanjiPuzzleDataOptions = {
  width: number;
  height: number;
  /** Optional seed for reproducibility */
  seed?: string | number;
  /** Probability (0–1) that any cell is filled. Default 0.4. Lower values produce sparser, often easier puzzles. */
  fillProbability?: number;
};

const MAX_GENERATION_ATTEMPTS = 200;

/**
 * Generates Hanji (nonogram) puzzle data that is guaranteed to have a unique solution.
 *
 * Creates random candidate grids and validates each with a line solver.
 * A line-solvable puzzle can be solved purely by logical deduction, which
 * guarantees exactly one solution exists.
 */
export function generateHanjiPuzzleData({
  width,
  height,
  seed,
  fillProbability = 0.5,
}: GenerateHanjiPuzzleDataOptions): HanjiPuzzleData {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const effectiveSeed = `${seed ?? Date.now()}-${attempt}`;
    const numericSeed = stringToSeed(effectiveSeed);
    const random = createSeededRandom(numericSeed);

    const solution: (0 | 1)[][] = [];
    for (let r = 0; r < height; r++) {
      const row: (0 | 1)[] = [];
      for (let c = 0; c < width; c++) {
        row.push((random() < fillProbability ? 1 : 0) as 0 | 1);
      }
      solution.push(row);
    }

    const rowClues = getRowClues(solution);
    const colClues = getColClues(solution);

    const result = isLineSolvable(rowClues, colClues, width, height);
    if (result.solvable) {
      return { width, height, rowClues, colClues, solution };
    }
  }

  throw new Error(
    `Failed to generate a uniquely solvable Hanji puzzle after ${MAX_GENERATION_ATTEMPTS} attempts`,
  );
}
