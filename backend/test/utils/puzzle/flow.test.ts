import { describe, expect, it } from 'vitest';

import {
  findFlowSolutions,
  generateFlowPuzzleData,
  isUniqueFlowSolution,
  type FlowPair,
} from '../../../src/utils/puzzle/flow';

describe('generateFlowPuzzleData', () => {
  it('generates a valid puzzle with correct structure', () => {
    const puzzleData = generateFlowPuzzleData({
      width: 8,
      height: 8,
      numPairs: 4,
      seed: 'flow-structure',
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(8);
    expect(puzzleData.height).toBe(8);
    expect(puzzleData.pairs).toHaveLength(4);

    for (const pair of puzzleData.pairs) {
      expect(pair.number).toBeGreaterThanOrEqual(1);
      expect(pair.number).toBeLessThanOrEqual(4);
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
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(4);
        if (v > 0) pathIds.add(v);
      }
    }
    expect(pathIds.size).toBe(4);

    for (const pair of puzzleData.pairs) {
      const [a, b] = pair.ends;
      expect(puzzleData.solution[a.row][a.col]).toBe(pair.number);
      expect(puzzleData.solution[b.row][b.col]).toBe(pair.number);
    }
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 8, height: 8, numPairs: 4, seed: 'flow-deterministic' } as const;
    const a = generateFlowPuzzleData(opts);
    const b = generateFlowPuzzleData(opts);

    expect(a.pairs).toEqual(b.pairs);
    expect(a.solution).toEqual(b.solution);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateFlowPuzzleData({ width: 8, height: 8, numPairs: 4, seed: 'seed-a' });
    const b = generateFlowPuzzleData({ width: 8, height: 8, numPairs: 4, seed: 'seed-b' });

    expect(a.solution).not.toEqual(b.solution);
  });

  it('generates a puzzle with a unique solution', () => {
    const puzzleData = generateFlowPuzzleData({
      width: 8,
      height: 8,
      numPairs: 4,
      seed: 'flow-unique',
    });

    const unique = isUniqueFlowSolution(puzzleData.width, puzzleData.height, puzzleData.pairs);
    expect(unique).toBe(true);

    const solutions = findFlowSolutions(puzzleData.width, puzzleData.height, puzzleData.pairs, 2);
    expect(solutions.length).toBe(1);
    const sol = puzzleData.solution;
    for (const pair of puzzleData.pairs) {
      const [a, b] = pair.ends;
      expect(sol[a.row][a.col]).toBe(pair.number);
      expect(sol[b.row][b.col]).toBe(pair.number);
    }
  });
});

describe('isUniqueFlowSolution', () => {
  it('returns true for trivial 1-pair when only one path exists (2x1)', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    expect(isUniqueFlowSolution(2, 1, pairs)).toBe(true);
  });

  it('returns true when exactly one solution exists', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
      {
        number: 2,
        ends: [
          { row: 1, col: 0 },
          { row: 1, col: 1 },
        ],
      },
    ];
    expect(isUniqueFlowSolution(2, 2, pairs)).toBe(true);
  });

  it('returns false when no solution exists', () => {
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
          { row: 1, col: 0 },
        ],
      },
    ];
    expect(isUniqueFlowSolution(2, 2, pairs)).toBe(false);
  });

  it('returns false for empty pairs', () => {
    expect(isUniqueFlowSolution(2, 2, [])).toBe(false);
  });
});

describe('findFlowSolutions', () => {
  it('returns one solution for 1-pair 2x1 (only one path)', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const solutions = findFlowSolutions(2, 1, pairs, 10);
    expect(solutions.length).toBe(1);
    expect(solutions[0][0][0]).toBe(1);
    expect(solutions[0][0][1]).toBe(1);
  });

  it('returns zero solutions for 2x2 opposite corners', () => {
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
          { row: 1, col: 0 },
        ],
      },
    ];
    const solutions = findFlowSolutions(2, 2, pairs, 10);
    expect(solutions.length).toBe(0);
  });

  it('stops at maxSolutions', () => {
    const pairs: FlowPair[] = [
      {
        number: 1,
        ends: [
          { row: 0, col: 0 },
          { row: 0, col: 1 },
        ],
      },
    ];
    const solutions = findFlowSolutions(2, 1, pairs, 2);
    expect(solutions.length).toBeLessThanOrEqual(2);
    expect(solutions.length).toBe(1);
  });
});
