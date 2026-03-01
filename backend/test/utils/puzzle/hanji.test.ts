import { describe, expect, it } from 'vitest';

import {
  generateHanjiPuzzleData,
  isLineSolvable,
  solveLine,
} from '../../../src/utils/puzzle/hanji';

describe('solveLine', () => {
  it('resolves an empty line (no clues) to all zeros', () => {
    const result = solveLine([], [-1, -1, -1, -1, -1], 5);
    expect(result).toEqual([0, 0, 0, 0, 0]);
  });

  it('resolves a full line (single clue spanning entire length)', () => {
    const result = solveLine([5], [-1, -1, -1, -1, -1], 5);
    expect(result).toEqual([1, 1, 1, 1, 1]);
  });

  it('resolves overlap for a single large block', () => {
    // Clue [4] in length 5: block can start at 0 or 1
    // Overlap: cells 1-3 must be filled
    const result = solveLine([4], [-1, -1, -1, -1, -1], 5);
    expect(result).toEqual([-1, 1, 1, 1, -1]);
  });

  it('resolves multiple blocks with tight fit', () => {
    // [2, 2] in length 5: only valid placement is [1,1,0,1,1]
    const result = solveLine([2, 2], [-1, -1, -1, -1, -1], 5);
    expect(result).toEqual([1, 1, 0, 1, 1]);
  });

  it('marks cells empty when no block can reach them', () => {
    // [1] in length 5 with known filled at position 0
    const result = solveLine([1], [1, -1, -1, -1, -1], 5);
    expect(result).toEqual([1, 0, 0, 0, 0]);
  });

  it('uses existing known cells to narrow placements', () => {
    // [3] in length 6, cell 2 is known filled → block must cover cell 2
    // Leftmost: start 0, rightmost: start 3... but cell 2 must be covered
    // So rightmost is start 2, leftmost is start 0 → overlap is cells 2..2
    // Wait, let me reconsider. With known[2]=1:
    // Valid starts: 0 (covers 0,1,2), 1 (covers 1,2,3), 2 (covers 2,3,4)
    // NOT 3 (covers 3,4,5 - doesn't cover cell 2)
    // Leftmost: 0, Rightmost: 2
    // Overlap: cells 2..2 → only cell 2 is guaranteed
    // Empty: cells outside [0, 2+3-1=4] → cell 5 is empty
    const known: (-1 | 0 | 1)[] = [-1, -1, 1, -1, -1, -1];
    const result = solveLine([3], known, 6);
    expect(result[2]).toBe(1);
    expect(result[5]).toBe(0);
  });

  it('resolves a line where known-empty splits placement', () => {
    // [2, 1] in length 6, cell 2 known empty
    // Block 1 (size 2) must be in [0,1]. Block 2 (size 1) somewhere in [3,5].
    const known: (-1 | 0 | 1)[] = [-1, -1, 0, -1, -1, -1];
    const result = solveLine([2, 1], known, 6);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(0);
  });
});

describe('isLineSolvable', () => {
  it('solves a trivial 1x1 filled puzzle', () => {
    const result = isLineSolvable([[1]], [[1]], 1, 1);
    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([[1]]);
  });

  it('solves a trivial 1x1 empty puzzle', () => {
    const result = isLineSolvable([[]], [[]], 1, 1);
    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([[0]]);
  });

  it('solves a known unique 5x5 frame puzzle', () => {
    // Border filled, center empty:
    //   1 1 1 1 1
    //   1 0 0 0 1
    //   1 0 0 0 1
    //   1 0 0 0 1
    //   1 1 1 1 1
    const rowClues = [[5], [1, 1], [1, 1], [1, 1], [5]];
    const colClues = [[5], [1, 1], [1, 1], [1, 1], [5]];

    const result = isLineSolvable(rowClues, colClues, 5, 5);
    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
    ]);
  });

  it('reports non-solvable for an ambiguous puzzle', () => {
    // 2x2 checkerboard ambiguity:
    // Clues: rows = [[1],[1]], cols = [[1],[1]]
    // Two valid solutions: [[1,0],[0,1]] and [[0,1],[1,0]]
    const rowClues = [[1], [1]];
    const colClues = [[1], [1]];

    const result = isLineSolvable(rowClues, colClues, 2, 2);
    expect(result.solvable).toBe(false);
  });

  it('solves a 3x3 fully constrained puzzle', () => {
    // All filled:
    //   1 1 1
    //   1 1 1
    //   1 1 1
    const rowClues = [[3], [3], [3]];
    const colClues = [[3], [3], [3]];

    const result = isLineSolvable(rowClues, colClues, 3, 3);
    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ]);
  });

  it('solves a 3x3 all-empty puzzle', () => {
    const rowClues = [[], [], []];
    const colClues = [[], [], []];

    const result = isLineSolvable(rowClues, colClues, 3, 3);
    expect(result.solvable).toBe(true);
    expect(result.solution).toEqual([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
  });
});

describe('generateHanjiPuzzleData', () => {
  it('generates a valid puzzle data', () => {
    const puzzleData = generateHanjiPuzzleData({
      width: 25,
      height: 25,
      seed: 'test-seed',
      fillProbability: 0.5,
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(25);
    expect(puzzleData.height).toBe(25);
    expect(puzzleData.rowClues.length).toBe(25);
    expect(puzzleData.colClues.length).toBe(25);
    expect(puzzleData.solution.length).toBe(25);
    expect(puzzleData.solution[0].length).toBe(25);

    for (const row of puzzleData.solution) {
      expect(row.length).toBe(25);
      for (const cell of row) {
        expect(cell === 0 || cell === 1).toBe(true);
      }
    }

    for (let r = 0; r < 25; r++) {
      const row = puzzleData.solution[r];
      const expectedClues: number[] = [];
      let run = 0;
      for (const cell of row) {
        if (cell === 1) {
          run++;
        } else if (run > 0) {
          expectedClues.push(run);
          run = 0;
        }
      }
      if (run > 0) expectedClues.push(run);
      expect(puzzleData.rowClues[r]).toEqual(expectedClues);
    }

    for (let c = 0; c < 25; c++) {
      const expectedClues: number[] = [];
      let run = 0;
      for (let r = 0; r < 25; r++) {
        if (puzzleData.solution[r][c] === 1) {
          run++;
        } else if (run > 0) {
          expectedClues.push(run);
          run = 0;
        }
      }
      if (run > 0) expectedClues.push(run);
      expect(puzzleData.colClues[c]).toEqual(expectedClues);
    }

    const solverResult = isLineSolvable(puzzleData.rowClues, puzzleData.colClues, 25, 25);
    expect(solverResult.solvable).toBe(true);
    expect(solverResult.solution).toEqual(puzzleData.solution);
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 10, height: 10, seed: 'deterministic', fillProbability: 0.4 };
    const a = generateHanjiPuzzleData(opts);
    const b = generateHanjiPuzzleData(opts);

    expect(a).toEqual(b);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateHanjiPuzzleData({ width: 10, height: 10, seed: 'seed-a' });
    const b = generateHanjiPuzzleData({ width: 10, height: 10, seed: 'seed-b' });

    expect(a.solution).not.toEqual(b.solution);
  });

  it('generates a small 5x5 puzzle', () => {
    const puzzleData = generateHanjiPuzzleData({
      width: 5,
      height: 5,
      seed: 'small',
      fillProbability: 0.5,
    });

    expect(puzzleData.width).toBe(5);
    expect(puzzleData.height).toBe(5);
    expect(puzzleData.solution.length).toBe(5);
    expect(puzzleData.solution.every((row) => row.length === 5)).toBe(true);

    const solverResult = isLineSolvable(puzzleData.rowClues, puzzleData.colClues, 5, 5);
    expect(solverResult.solvable).toBe(true);
    expect(solverResult.solution).toEqual(puzzleData.solution);
  });
});
