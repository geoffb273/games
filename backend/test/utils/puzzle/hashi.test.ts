import { describe, expect, it } from 'vitest';

import { generateHashiPuzzleData, solveHashi } from '../../../src/utils/puzzle/hashi';

describe('solveHashi', () => {
  it('solves two islands connected by a single bridge', () => {
    // (2)===(2)  on a 1x5 grid
    const islands = [
      { row: 0, col: 0, requiredBridges: 2 },
      { row: 0, col: 4, requiredBridges: 2 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([
      { from: { row: 0, col: 0 }, to: { row: 0, col: 4 }, bridges: 2 },
    ]);
  });

  it('solves three islands in a line', () => {
    // (1)--(2)--(1)
    const islands = [
      { row: 0, col: 0, requiredBridges: 1 },
      { row: 0, col: 2, requiredBridges: 2 },
      { row: 0, col: 4, requiredBridges: 1 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(true);
    expect(result.solution).toHaveLength(2);

    for (const bridge of result.solution!) {
      expect(bridge.bridges).toBe(1);
    }
  });

  it('solves a four-island square with unique solution', () => {
    //  (2)--(2)
    //   |    |
    //  (2)--(2)
    const islands = [
      { row: 0, col: 0, requiredBridges: 2 },
      { row: 0, col: 2, requiredBridges: 2 },
      { row: 2, col: 0, requiredBridges: 2 },
      { row: 2, col: 2, requiredBridges: 2 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(true);
    expect(result.solution).toHaveLength(4);
    for (const bridge of result.solution!) {
      expect(bridge.bridges).toBe(1);
    }
  });

  it('reports ambiguous for a four-island square where each island needs 3', () => {
    // Each island has 2 connections and needs 3 bridges.
    // Both (1,2) and (2,1) splits are valid → 2 solutions.
    const islands = [
      { row: 0, col: 0, requiredBridges: 3 },
      { row: 0, col: 2, requiredBridges: 3 },
      { row: 2, col: 0, requiredBridges: 3 },
      { row: 2, col: 2, requiredBridges: 3 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(false);
  });

  it('detects crossing conflict making puzzle unsolvable', () => {
    // A=(0,1), B=(2,0), C=(2,2), D=(4,1)
    // B-C is horizontal through row 2, A-D is vertical through col 1.
    // These cross, so only one can have bridges → at least one island unsatisfied.
    const islands = [
      { row: 0, col: 1, requiredBridges: 1 },
      { row: 2, col: 0, requiredBridges: 1 },
      { row: 2, col: 2, requiredBridges: 1 },
      { row: 4, col: 1, requiredBridges: 1 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(false);
  });

  it('solves a larger hand-crafted puzzle', () => {
    // T-shape:
    //  A-B-C      (0,0) (0,2) (0,4)
    //    |
    //    D         (2,2)
    //    |
    //    E         (4,2)
    // A=1, B=3, C=1, D=2, E=1
    // Bridges: A-B=1, B-C=1, B-D=1, D-E=1
    // (B has 3: A-B + B-C + B-D = 1+1+1)
    // (D has 2: B-D + D-E = 1+1)
    const islands = [
      { row: 0, col: 0, requiredBridges: 1 },
      { row: 0, col: 2, requiredBridges: 3 },
      { row: 0, col: 4, requiredBridges: 1 },
      { row: 2, col: 2, requiredBridges: 2 },
      { row: 4, col: 2, requiredBridges: 1 },
    ];
    const result = solveHashi(islands);

    expect(result.solvable).toBe(true);
    expect(result.solution).toHaveLength(4);
    for (const bridge of result.solution!) {
      expect(bridge.bridges).toBe(1);
    }
  });
});

describe('generateHashiPuzzleData', () => {
  it('generates a valid puzzle with correct structure', () => {
    const puzzleData = generateHashiPuzzleData({
      width: 9,
      height: 9,
      seed: 'test-seed',
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(9);
    expect(puzzleData.height).toBe(9);
    expect(puzzleData.islands.length).toBeGreaterThanOrEqual(2);
    expect(puzzleData.solution.length).toBeGreaterThanOrEqual(1);

    for (const island of puzzleData.islands) {
      expect(island.row).toBeGreaterThanOrEqual(0);
      expect(island.row).toBeLessThan(9);
      expect(island.col).toBeGreaterThanOrEqual(0);
      expect(island.col).toBeLessThan(9);
      expect(island.requiredBridges).toBeGreaterThanOrEqual(1);
      expect(island.requiredBridges).toBeLessThanOrEqual(8);
    }

    for (const bridge of puzzleData.solution) {
      expect([1, 2]).toContain(bridge.bridges);
    }

    // Verify island bridge counts match solution
    const bridgeSums = new Map<string, number>();
    for (const island of puzzleData.islands) {
      bridgeSums.set(`${island.row},${island.col}`, 0);
    }
    for (const bridge of puzzleData.solution) {
      const fromKey = `${bridge.from.row},${bridge.from.col}`;
      const toKey = `${bridge.to.row},${bridge.to.col}`;
      bridgeSums.set(fromKey, (bridgeSums.get(fromKey) ?? 0) + bridge.bridges);
      bridgeSums.set(toKey, (bridgeSums.get(toKey) ?? 0) + bridge.bridges);
    }
    for (const island of puzzleData.islands) {
      const key = `${island.row},${island.col}`;
      expect(bridgeSums.get(key)).toBe(island.requiredBridges);
    }
  });

  it('generates a puzzle that the solver confirms as uniquely solvable', () => {
    const puzzleData = generateHashiPuzzleData({
      width: 7,
      height: 7,
      seed: 'solver-verify',
    });

    const solverResult = solveHashi(puzzleData.islands);
    expect(solverResult.solvable).toBe(true);

    const sortBridges = (
      bridges: {
        from: { row: number; col: number };
        to: { row: number; col: number };
        bridges: 1 | 2;
      }[],
    ) =>
      [...bridges].sort((a, b) => {
        if (a.from.row !== b.from.row) return a.from.row - b.from.row;
        if (a.from.col !== b.from.col) return a.from.col - b.from.col;
        if (a.to.row !== b.to.row) return a.to.row - b.to.row;
        return a.to.col - b.to.col;
      });

    expect(sortBridges(solverResult.solution!)).toEqual(sortBridges(puzzleData.solution));
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 7, height: 7, seed: 'deterministic' };
    const a = generateHashiPuzzleData(opts);
    const b = generateHashiPuzzleData(opts);

    expect(a).toEqual(b);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateHashiPuzzleData({ width: 7, height: 7, seed: 'seed-a' });
    const b = generateHashiPuzzleData({ width: 7, height: 7, seed: 'seed-b' });

    expect(a.islands).not.toEqual(b.islands);
  });

  it('generates a small 5x5 puzzle', () => {
    const puzzleData = generateHashiPuzzleData({
      width: 5,
      height: 5,
      seed: 'small',
      islandCount: 4,
    });

    expect(puzzleData.width).toBe(5);
    expect(puzzleData.height).toBe(5);
    expect(puzzleData.islands.length).toBeGreaterThanOrEqual(2);

    const solverResult = solveHashi(puzzleData.islands);
    expect(solverResult.solvable).toBe(true);
  });
});
