import type { HanjiCellState } from '@/utils/hanji/lineValidation';
import { getRuns, isPuzzleComplete, lineMatchesClues } from '@/utils/hanji/lineValidation';

describe('getRuns', () => {
  it('returns empty array for empty line', () => {
    expect(getRuns([])).toEqual([]);
  });

  it('returns empty array when no filled cells', () => {
    expect(getRuns(['empty', 'marked', 'empty'])).toEqual([]);
  });

  it('returns single run for all filled', () => {
    expect(getRuns(['filled', 'filled', 'filled'])).toEqual([3]);
  });

  it('returns run lengths for filled segments separated by non-filled', () => {
    expect(getRuns(['filled', 'filled', 'marked', 'filled'])).toEqual([2, 1]);
  });

  it('ignores empty and marked between runs', () => {
    expect(getRuns(['filled', 'empty', 'empty', 'filled', 'filled', 'marked'])).toEqual([1, 2]);
  });

  it('handles single filled cell', () => {
    expect(getRuns(['marked', 'filled', 'empty'])).toEqual([1]);
  });
});

describe('lineMatchesClues', () => {
  it('returns true when runs match clues exactly', () => {
    const line: HanjiCellState[] = ['filled', 'filled', 'marked', 'filled'];
    expect(lineMatchesClues(line, [2, 1])).toBe(true);
  });

  it('returns false when run count differs', () => {
    const line: HanjiCellState[] = ['filled', 'marked', 'filled'];
    expect(lineMatchesClues(line, [1])).toBe(false);
    expect(lineMatchesClues(line, [1, 1, 1])).toBe(false);
  });

  it('returns false when run lengths differ', () => {
    const line: HanjiCellState[] = ['filled', 'filled', 'marked'];
    expect(lineMatchesClues(line, [1, 1])).toBe(false);
    expect(lineMatchesClues(line, [3])).toBe(false);
  });

  it('returns true for empty line and empty clues', () => {
    expect(lineMatchesClues([], [])).toBe(true);
  });

  it('returns false for empty line with non-empty clues', () => {
    expect(lineMatchesClues([], [1])).toBe(false);
  });

  it('returns false for non-empty line with empty clues', () => {
    expect(lineMatchesClues(['filled'], [])).toBe(false);
  });
});

describe('isPuzzleComplete', () => {
  it('returns false when any cell is empty', () => {
    const grid: HanjiCellState[][] = [
      ['filled', 'filled'],
      ['filled', 'empty'],
    ];
    const rowClues = [[2], [1]];
    const colClues = [[2], [1]];
    expect(isPuzzleComplete(grid, rowClues, colClues, 2, 2)).toBe(false);
  });

  it('returns false when row does not match clues', () => {
    const grid: HanjiCellState[][] = [
      ['filled', 'filled', 'filled'],
      ['filled', 'marked', 'filled'],
    ];
    const rowClues = [[2], [1, 1]];
    const colClues = [[2], [1], [2]];
    expect(isPuzzleComplete(grid, rowClues, colClues, 3, 2)).toBe(false);
  });

  it('returns false when column does not match clues', () => {
    const grid: HanjiCellState[][] = [
      ['filled', 'filled'],
      ['filled', 'filled'],
    ];
    const rowClues = [[2], [2]];
    const colClues = [[1], [2]];
    expect(isPuzzleComplete(grid, rowClues, colClues, 2, 2)).toBe(false);
  });

  it('returns true when all cells filled or marked and all clues match', () => {
    const grid: HanjiCellState[][] = [
      ['filled', 'filled', 'marked'],
      ['filled', 'marked', 'filled'],
    ];
    const rowClues = [[2], [1, 1]];
    const colClues = [[2], [1], [1]];
    expect(isPuzzleComplete(grid, rowClues, colClues, 3, 2)).toBe(true);
  });

  it('returns true for 1x1 complete grid', () => {
    const grid: HanjiCellState[][] = [['filled']];
    expect(isPuzzleComplete(grid, [[1]], [[1]], 1, 1)).toBe(true);
  });

  it('returns true when grid uses only marked (no filled runs)', () => {
    const grid: HanjiCellState[][] = [
      ['marked', 'marked'],
      ['marked', 'marked'],
    ];
    const rowClues = [[], []];
    const colClues = [[], []];
    expect(isPuzzleComplete(grid, rowClues, colClues, 2, 2)).toBe(true);
  });
});
