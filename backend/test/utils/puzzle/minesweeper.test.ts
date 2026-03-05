import { describe, expect, it } from 'vitest';

import {
  computeAdjacencyCounts,
  generateMinesweeperPuzzleData,
  isSolvableByPropagation,
} from '../../../src/utils/puzzle/minesweeper';

/**
 * Helper: compute adjacency value for a single cell.
 */
function adjacencyValue(mines: boolean[][], r: number, c: number): number {
  const h = mines.length;
  const w = mines[0].length;
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < h && nc >= 0 && nc < w && mines[nr][nc]) count++;
    }
  }
  return count;
}

describe('generateMinesweeperPuzzleData', () => {
  it('generates a valid puzzle with correct structure', () => {
    const puzzleData = generateMinesweeperPuzzleData({
      width: 9,
      height: 9,
      mineCount: 10,
      seed: 'test-seed',
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(9);
    expect(puzzleData.height).toBe(9);
    expect(puzzleData.mineCount).toBe(10);
    expect(puzzleData.solution.length).toBe(9);
    expect(puzzleData.solution.every((row) => row.length === 9)).toBe(true);

    const actualMineCount = puzzleData.solution.flat().filter(Boolean).length;
    expect(actualMineCount).toBe(10);

    for (const cell of puzzleData.revealedCells) {
      expect(cell.row).toBeGreaterThanOrEqual(0);
      expect(cell.row).toBeLessThan(9);
      expect(cell.col).toBeGreaterThanOrEqual(0);
      expect(cell.col).toBeLessThan(9);
      expect(puzzleData.solution[cell.row][cell.col]).toBe(false);
      expect(cell.value).toBeGreaterThanOrEqual(0);
      expect(cell.value).toBeLessThanOrEqual(8);
    }
  });

  it('generates a puzzle that the solver confirms as solvable by propagation', () => {
    const puzzleData = generateMinesweeperPuzzleData({
      width: 9,
      height: 9,
      mineCount: 10,
      seed: 'solver-verify',
    });

    const adjacency = computeAdjacencyCounts(
      puzzleData.solution,
      puzzleData.width,
      puzzleData.height,
    );
    const solvable = isSolvableByPropagation(
      adjacency,
      puzzleData.revealedCells,
      puzzleData.width,
      puzzleData.height,
      puzzleData.mineCount,
    );
    expect(solvable).toBe(true);
  });

  it('adjacency numbers are correct for all revealed cells', () => {
    const puzzleData = generateMinesweeperPuzzleData({
      width: 9,
      height: 9,
      mineCount: 10,
      seed: 'adjacency-check',
    });

    for (const cell of puzzleData.revealedCells) {
      const expected = adjacencyValue(puzzleData.solution, cell.row, cell.col);
      expect(cell.value).toBe(expected);
    }
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 9, height: 9, mineCount: 10, seed: 'deterministic' } as const;
    const a = generateMinesweeperPuzzleData(opts);
    const b = generateMinesweeperPuzzleData(opts);

    expect(a).toEqual(b);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateMinesweeperPuzzleData({ width: 9, height: 9, mineCount: 10, seed: 'seed-a' });
    const b = generateMinesweeperPuzzleData({ width: 9, height: 9, mineCount: 10, seed: 'seed-b' });

    expect(a.solution).not.toEqual(b.solution);
  });

  it('generates a small 5x5 puzzle', () => {
    const puzzleData = generateMinesweeperPuzzleData({
      width: 5,
      height: 5,
      mineCount: 4,
      seed: 'small',
    });

    expect(puzzleData.width).toBe(5);
    expect(puzzleData.height).toBe(5);
    expect(puzzleData.mineCount).toBe(4);

    const result = isSolvableByPropagation(
      puzzleData.solution,
      puzzleData.revealedCells,
      puzzleData.width,
      puzzleData.height,
      puzzleData.mineCount,
    );
    expect(result).toBe(true);
  });
});
