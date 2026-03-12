import { isFlowComplete } from '@/utils/flow/validation';

type FlowPair = {
  number: number;
  ends: [{ row: number; col: number }, { row: number; col: number }];
};

function pair(
  n: number,
  start: { row: number; col: number },
  end: { row: number; col: number },
): FlowPair {
  return { number: n, ends: [start, end] };
}

describe('isFlowComplete', () => {
  describe('grid dimensions', () => {
    it('returns false when grid has wrong number of rows', () => {
      const grid = [
        [1, 1],
        [1, 1],
        [1, 1],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 0, col: 1 })];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });

    it('returns false when grid has wrong number of columns', () => {
      const grid = [
        [1, 1, 1],
        [1, 1, 1],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 1, col: 0 })];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });

    it('returns false for empty grid when height > 0', () => {
      const grid: number[][] = [];
      const pairs: FlowPair[] = [];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });
  });

  describe('filled cells', () => {
    it('returns false when any cell is zero', () => {
      const grid = [
        [1, 1],
        [1, 0],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 0, col: 1 })];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });
  });

  describe('pair endpoints', () => {
    it('returns false when start cell does not have pair number', () => {
      const grid = [
        [2, 1],
        [1, 1],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 1, col: 1 })];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });

    it('returns false when end cell does not have pair number', () => {
      const grid = [
        [1, 1],
        [1, 2],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 1, col: 1 })];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(false);
    });
  });

  describe('path connectivity', () => {
    it('returns false when pair endpoints are not connected by same-number path', () => {
      const grid = [
        [1, 2, 1],
        [2, 2, 2],
        [1, 2, 1],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 0, col: 2 })];
      expect(isFlowComplete(3, 3, pairs, grid)).toBe(false);
    });

    it('returns true when single pair forms a connected path', () => {
      const grid = [
        [1, 1, 1],
        [1, 1, 1],
        [1, 1, 1],
      ];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 2, col: 2 })];
      expect(isFlowComplete(3, 3, pairs, grid)).toBe(true);
    });

    it('returns true when multiple pairs are all connected', () => {
      const grid = [
        [1, 1, 2],
        [1, 1, 2],
        [1, 2, 2],
      ];
      const pairs: FlowPair[] = [
        pair(1, { row: 0, col: 0 }, { row: 2, col: 0 }),
        pair(2, { row: 0, col: 2 }, { row: 2, col: 2 }),
      ];
      expect(isFlowComplete(3, 3, pairs, grid)).toBe(true);
    });

    it('returns false when second pair is not connected', () => {
      const grid = [
        [1, 1, 2],
        [1, 1, 3],
        [1, 2, 2],
      ];
      const pairs: FlowPair[] = [
        pair(1, { row: 0, col: 0 }, { row: 2, col: 0 }),
        pair(2, { row: 0, col: 2 }, { row: 2, col: 2 }),
      ];
      expect(isFlowComplete(3, 3, pairs, grid)).toBe(false);
    });

    it('returns true for 1x1 grid with one pair (start equals end)', () => {
      const grid = [[1]];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 0, col: 0 })];
      expect(isFlowComplete(1, 1, pairs, grid)).toBe(true);
    });

    it('returns true for straight horizontal path', () => {
      const grid = [[1, 1, 1]];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 0, col: 2 })];
      expect(isFlowComplete(3, 1, pairs, grid)).toBe(true);
    });

    it('returns true for straight vertical path', () => {
      const grid = [[1], [1], [1]];
      const pairs: FlowPair[] = [pair(1, { row: 0, col: 0 }, { row: 2, col: 0 })];
      expect(isFlowComplete(1, 3, pairs, grid)).toBe(true);
    });
  });

  describe('empty pairs', () => {
    it('returns true when grid is filled and pairs is empty', () => {
      const grid = [
        [1, 1],
        [1, 1],
      ];
      const pairs: FlowPair[] = [];
      expect(isFlowComplete(2, 2, pairs, grid)).toBe(true);
    });
  });
});
