import { describe, expect, it } from 'vitest';

import {
  generateFlowPuzzleData,
  isValidFlowSolution,
  type FlowPair,
} from '../../../src/utils/puzzle/flow';

describe('generateFlowPuzzleData', () => {
  it('generates a valid puzzle with correct structure and full grid', () => {
    const puzzleData = generateFlowPuzzleData({
      width: 8,
      height: 8,
      seed: 'flow-structure',
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(8);
    expect(puzzleData.height).toBe(8);
    expect(puzzleData.pairs.length).toBeGreaterThanOrEqual(1);

    const numPairs = puzzleData.pairs.length;
    for (const pair of puzzleData.pairs) {
      expect(pair.number).toBeGreaterThanOrEqual(1);
      expect(pair.number).toBeLessThanOrEqual(numPairs);
      expect(pair.ends).toHaveLength(2);
      const [a, b] = pair.ends;
      expect(a.row).toBeGreaterThanOrEqual(0);
      expect(a.row).toBeLessThan(8);
      expect(a.col).toBeGreaterThanOrEqual(0);
      expect(a.col).toBeLessThan(8);
      expect(b.row).toBeGreaterThanOrEqual(0);
      expect(b.row).toBeLessThan(8);
      expect(b.col).toBeGreaterThanOrEqual(0);
      expect(b.col).toBeLessThan(8);
      expect(a.row !== b.row || a.col !== b.col).toBe(true);
    }

    expect(puzzleData.solution.length).toBe(8);
    expect(puzzleData.solution.every((row) => row.length === 8)).toBe(true);

    const pathIds = new Set<number>();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const v = puzzleData.solution[r][c];
        expect(v).toBeGreaterThanOrEqual(1);
        expect(v).toBeLessThanOrEqual(numPairs);
        pathIds.add(v);
      }
    }
    expect(pathIds.size).toBe(numPairs);

    for (const pair of puzzleData.pairs) {
      const [a, b] = pair.ends;
      expect(puzzleData.solution[a.row][a.col]).toBe(pair.number);
      expect(puzzleData.solution[b.row][b.col]).toBe(pair.number);
    }

    // Grid must be completely filled (no zeros)
    expect(puzzleData.solution.flat().every((v) => v >= 1 && v <= numPairs)).toBe(true);
    expect(puzzleData.solution.flat().length).toBe(8 * 8);
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 8, height: 8, seed: 'flow-deterministic' } as const;
    const a = generateFlowPuzzleData(opts);
    const b = generateFlowPuzzleData(opts);

    expect(a.pairs).toEqual(b.pairs);
    expect(a.solution).toEqual(b.solution);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateFlowPuzzleData({ width: 8, height: 8, seed: 'seed-a' });
    const b = generateFlowPuzzleData({ width: 8, height: 8, seed: 'seed-b' });

    expect(a.solution).not.toEqual(b.solution);
  });

  it('throws when width or height is less than 4', () => {
    expect(() => generateFlowPuzzleData({ width: 3, height: 8, seed: 'x' })).toThrow(
      /width and height must each be 4 or greater/,
    );
    expect(() => generateFlowPuzzleData({ width: 8, height: 3, seed: 'x' })).toThrow(
      /width and height must each be 4 or greater/,
    );
  });

  it('throws when grid area is not greater than 4x4', () => {
    // 4x4 has area 16 (dimensions are valid, area is not)
    expect(() => generateFlowPuzzleData({ width: 4, height: 4, seed: 'x' })).toThrow(
      /area must be greater than 4x4/,
    );
  });

  it('throws when grid has too few cells to place any path', () => {
    expect(() => generateFlowPuzzleData({ width: 1, height: 3, seed: 'x' })).toThrow();
  });

  it('generates an 8x8 puzzle whose solution is valid', () => {
    const { width, height, pairs, solution } = generateFlowPuzzleData({
      width: 8,
      height: 8,
      seed: 'flow-8x8',
    });
    expect(width).toBe(8);
    expect(height).toBe(8);
    expect(solution).toHaveLength(8);
    expect(solution.every((row) => row.length === 8)).toBe(true);
    expect(isValidFlowSolution(width, height, pairs, solution)).toBe(true);
  });
});

describe('isValidFlowSolution', () => {
  it('returns true for a valid solution', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[1, 1]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(true);
  });

  it('returns false when grid dimensions do not match', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[1, 1, 0]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
    expect(isValidFlowSolution(2, 1, pairs, [])).toBe(false);
  });

  it('returns false when grid has a zero (incomplete)', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[1, 0]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
  });

  it('returns false when endpoint does not have pair number', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[2, 2]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
  });

  it('returns false when pair cells do not form a connected path', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 1, col: 0 },
          { row: 1, col: 2 },
        ],
      },
    ];
    const grid = [
      [1, 2, 1],
      [2, 2, 2],
    ];
    expect(isValidFlowSolution(3, 2, pairs, grid)).toBe(false);
  });

  it('returns false when a cell value exceeds numPairs', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[1, 2]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
  });

  it('returns false when a cell value is negative', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 2 },
        ],
      },
    ];
    const grid = [[1, -1, 1]];
    expect(isValidFlowSolution(3, 1, pairs, grid)).toBe(false);
  });

  it('returns false when row count does not match height', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [
      [1, 1],
      [1, 1],
    ];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
  });

  it('returns false when column count does not match width', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const grid = [[1, 1, 1]];
    expect(isValidFlowSolution(2, 1, pairs, grid)).toBe(false);
  });

  it('returns false when same id appears in disconnected components', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 1 },
          { row: 1, col: 2 },
        ],
      },
    ];
    // id 1 at (0,0), (0,2), (1,1) — no path connects all three
    const grid = [
      [1, 2, 1],
      [2, 1, 2],
    ];
    expect(isValidFlowSolution(3, 2, pairs, grid)).toBe(false);
  });

  it('returns false when total count of id exceeds connected component from endpoint', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 2, col: 0 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 1 },
          { row: 2, col: 2 },
        ],
      },
    ];
    // id 1 at (0,0), (1,0), (2,0) and (0,2) — (0,2) is disconnected from (0,0)-(2,0)
    const grid = [
      [1, 2, 1],
      [1, 2, 2],
      [1, 2, 2],
    ];
    expect(isValidFlowSolution(3, 3, pairs, grid)).toBe(false);
  });

  it('returns true for valid solution with multiple pairs', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 1 },
          { row: 1, col: 1 },
        ],
      },
    ];
    const grid = [
      [1, 2],
      [1, 2],
    ];
    expect(isValidFlowSolution(2, 2, pairs, grid)).toBe(true);
  });

  it('returns true for valid 3x3 solution with two paths', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 1, col: 1 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 2 },
          { row: 2, col: 0 },
        ],
      },
    ];
    const grid = [
      [1, 1, 2],
      [1, 1, 2],
      [2, 2, 2],
    ];
    expect(isValidFlowSolution(3, 3, pairs, grid)).toBe(true);
  });

  it('returns false when second endpoint is not reachable from first', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 2, col: 2 },
        ],
      },
    ];
    // id 1 forms L-shape that does not include (2,2)
    const grid = [
      [1, 1, 2],
      [1, 2, 2],
      [2, 2, 2],
    ];
    expect(isValidFlowSolution(3, 3, pairs, grid)).toBe(false);
  });

  it('accepts multiple hand-made 8x8 valid solutions (row-based and column-based puzzles)', () => {
    const width = 8;
    const height = 8;

    // Puzzle 1: each row is one path — path i connects (i,0) to (i,7)
    const rowBasedPairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 7 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 1, col: 0 },
          { row: 1, col: 7 },
        ],
      },
      {
        number: 3,
        ends: [
          { row: 2, col: 0 },
          { row: 2, col: 7 },
        ],
      },
      {
        number: 4,
        ends: [
          { row: 3, col: 0 },
          { row: 3, col: 7 },
        ],
      },
      {
        number: 5,
        ends: [
          { row: 4, col: 0 },
          { row: 4, col: 7 },
        ],
      },
      {
        number: 6,
        ends: [
          { row: 5, col: 0 },
          { row: 5, col: 7 },
        ],
      },
      {
        number: 7,
        ends: [
          { row: 6, col: 0 },
          { row: 6, col: 7 },
        ],
      },
      {
        number: 8,
        ends: [
          { row: 7, col: 0 },
          { row: 7, col: 7 },
        ],
      },
    ];
    const rowBasedSolution: number[][] = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6],
      [7, 7, 7, 7, 7, 7, 7, 7],
      [8, 8, 8, 8, 8, 8, 8, 8],
    ];
    expect(isValidFlowSolution(width, height, rowBasedPairs, rowBasedSolution)).toBe(true);

    // Puzzle 2: each column is one path — path i connects (0,i) to (7,i)
    const columnBasedPairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 7, col: 0 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 1 },
          { row: 7, col: 1 },
        ],
      },
      {
        number: 3,
        ends: [
          { row: 0, col: 2 },
          { row: 7, col: 2 },
        ],
      },
      {
        number: 4,
        ends: [
          { row: 0, col: 3 },
          { row: 7, col: 3 },
        ],
      },
      {
        number: 5,
        ends: [
          { row: 0, col: 4 },
          { row: 7, col: 4 },
        ],
      },
      {
        number: 6,
        ends: [
          { row: 0, col: 5 },
          { row: 7, col: 5 },
        ],
      },
      {
        number: 7,
        ends: [
          { row: 0, col: 6 },
          { row: 7, col: 6 },
        ],
      },
      {
        number: 8,
        ends: [
          { row: 0, col: 7 },
          { row: 7, col: 7 },
        ],
      },
    ];
    const columnBasedSolution: number[][] = [
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
      [1, 2, 3, 4, 5, 6, 7, 8],
    ];
    expect(isValidFlowSolution(width, height, columnBasedPairs, columnBasedSolution)).toBe(true);

    // Puzzle 3: 4 quadrants — path i fills quadrant i, corner to corner
    const quadrantPairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 3, col: 3 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 0, col: 4 },
          { row: 3, col: 7 },
        ],
      },
      {
        number: 3,
        ends: [
          { row: 4, col: 0 },
          { row: 7, col: 3 },
        ],
      },
      {
        number: 4,
        ends: [
          { row: 4, col: 4 },
          { row: 7, col: 7 },
        ],
      },
    ];
    const quadrantSolution: number[][] = [
      [1, 1, 1, 1, 2, 2, 2, 2],
      [1, 1, 1, 1, 2, 2, 2, 2],
      [1, 1, 1, 1, 2, 2, 2, 2],
      [1, 1, 1, 1, 2, 2, 2, 2],
      [3, 3, 3, 3, 4, 4, 4, 4],
      [3, 3, 3, 3, 4, 4, 4, 4],
      [3, 3, 3, 3, 4, 4, 4, 4],
      [3, 3, 3, 3, 4, 4, 4, 4],
    ];
    expect(isValidFlowSolution(width, height, quadrantPairs, quadrantSolution)).toBe(true);
  });
});
