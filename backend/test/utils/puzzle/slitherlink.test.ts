import { describe, expect, it } from 'vitest';

import {
  findSlitherlinkSolutions,
  generateSlitherlinkPuzzleData,
} from '../../../src/utils/puzzle/slitherlink';

describe('generateSlitherlinkPuzzleData', () => {
  it('generates a valid puzzle with correct structure', () => {
    const puzzleData = generateSlitherlinkPuzzleData({
      width: 9,
      height: 9,
      seed: 'slitherlink-structure',
    });

    expect(puzzleData).toBeDefined();
    expect(puzzleData.width).toBe(9);
    expect(puzzleData.height).toBe(9);

    expect(puzzleData.clues.length).toBe(9);
    expect(puzzleData.clues.every((row) => row.length === 9)).toBe(true);

    const { horizontalEdges, verticalEdges } = puzzleData.solution;

    expect(horizontalEdges.length).toBe(10);
    expect(horizontalEdges.every((row) => row.length === 9)).toBe(true);

    expect(verticalEdges.length).toBe(9);
    expect(verticalEdges.every((row) => row.length === 10)).toBe(true);

    // There should be at least one edge in the loop.
    const edgeCount =
      horizontalEdges.flat().filter(Boolean).length + verticalEdges.flat().filter(Boolean).length;
    expect(edgeCount).toBeGreaterThan(0);
  });

  it('produces deterministic output for the same seed', () => {
    const opts = { width: 9, height: 9, seed: 'slitherlink-deterministic' } as const;
    const a = generateSlitherlinkPuzzleData(opts);
    const b = generateSlitherlinkPuzzleData(opts);

    expect(a).toEqual(b);
  });

  it('produces different puzzles for different seeds', () => {
    const a = generateSlitherlinkPuzzleData({ width: 9, height: 9, seed: 'seed-a' });
    const b = generateSlitherlinkPuzzleData({ width: 9, height: 9, seed: 'seed-b' });

    expect(a.solution).not.toEqual(b.solution);
  });

  it('generates a puzzle with a unique solution', () => {
    const puzzleData = generateSlitherlinkPuzzleData({
      width: 9,
      height: 9,
      seed: 'slitherlink-unique',
    });

    const solutions = findSlitherlinkSolutions(
      puzzleData.width,
      puzzleData.height,
      puzzleData.clues,
      2,
    );
    expect(solutions.length).toBe(1);
    expect(solutions[0].horizontalEdges).toEqual(puzzleData.solution.horizontalEdges);
    expect(solutions[0].verticalEdges).toEqual(puzzleData.solution.verticalEdges);
  });
});

describe('generateSlitherlinkPuzzleData uniqueness (measured)', () => {
  const RUNS_9X9 = 100;
  const MIN_SUCCESS_RATE_PERCENT = 90;

  it('reports success rate for 9×9 over many runs', () => {
    let success9 = 0;

    for (let i = 0; i < RUNS_9X9; i++) {
      try {
        generateSlitherlinkPuzzleData({ width: 9, height: 9, seed: `measure-9-${i}` });
        success9++;
      } catch {
        // failed to find unique puzzle within attempt limit
      }
    }

    const rate9 = (success9 / RUNS_9X9) * 100;

    expect(rate9).toBeGreaterThanOrEqual(MIN_SUCCESS_RATE_PERCENT);
  }, 60_000);
});
