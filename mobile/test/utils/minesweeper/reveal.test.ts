import type { MinesweeperCellValueDisplay } from '@/api/puzzle/puzzle';
import { getCellsToReveal } from '@/utils/minesweeper/reveal';

describe('getCellsToReveal', () => {
  describe('out of bounds', () => {
    it('returns no cells when row is out of bounds', () => {
      const field: MinesweeperCellValueDisplay[][] = [[0]];
      expect(getCellsToReveal(1, 0, field, 1, 1)).toEqual({
        hitMine: false,
        cells: [],
      });
    });

    it('returns no cells when col is out of bounds', () => {
      const field: MinesweeperCellValueDisplay[][] = [[0]];
      expect(getCellsToReveal(0, 1, field, 1, 1)).toEqual({
        hitMine: false,
        cells: [],
      });
    });

    it('returns no cells when row is negative', () => {
      const field: MinesweeperCellValueDisplay[][] = [[0]];
      expect(getCellsToReveal(-1, 0, field, 1, 1)).toEqual({
        hitMine: false,
        cells: [],
      });
    });
  });

  describe('mine', () => {
    it('returns hitMine when tapping a mine', () => {
      const field: MinesweeperCellValueDisplay[][] = [['MINE']];
      expect(getCellsToReveal(0, 0, field, 1, 1)).toEqual({
        hitMine: true,
        cells: [],
      });
    });

    it('returns hitMine when tapping a mine in a larger grid', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [0, 1],
        [1, 'MINE'],
      ];
      expect(getCellsToReveal(1, 1, field, 2, 2)).toEqual({
        hitMine: true,
        cells: [],
      });
    });
  });

  describe('numbered cell (1–8)', () => {
    it('returns only that cell when tapping 1', () => {
      const field: MinesweeperCellValueDisplay[][] = [[1]];
      expect(getCellsToReveal(0, 0, field, 1, 1)).toEqual({
        hitMine: false,
        cells: [{ row: 0, col: 0, value: 1 }],
      });
    });

    it('returns only that cell when tapping 8', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [1, 2, 1],
        [2, 8, 2],
        [1, 2, 1],
      ];
      expect(getCellsToReveal(1, 1, field, 3, 3)).toEqual({
        hitMine: false,
        cells: [{ row: 1, col: 1, value: 8 }],
      });
    });
  });

  describe('zero cell', () => {
    it('returns zero plus numbered border when zero has no zero neighbors', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ];
      const result = getCellsToReveal(1, 1, field, 3, 3);
      expect(result.hitMine).toBe(false);
      expect(result.cells).toHaveLength(9); // center 0 + 8 border 1s
      expect(result.cells).toContainEqual({ row: 1, col: 1, value: 0 });
    });

    it('flood-fills connected zeros and their numbered border', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [0, 0, 1],
        [0, 0, 1],
        [1, 1, 1],
      ];
      const result = getCellsToReveal(0, 0, field, 3, 3);
      expect(result.hitMine).toBe(false);
      expect(result.cells).toHaveLength(9); // 4 zeros + 5 border 1s
      const byKey = new Set(result.cells.map((c) => `${c.row},${c.col}`));
      expect(byKey.has('0,0')).toBe(true);
      expect(byKey.has('0,1')).toBe(true);
      expect(byKey.has('1,0')).toBe(true);
      expect(byKey.has('1,1')).toBe(true);
      expect(byKey.has('0,2')).toBe(true);
      expect(byKey.has('1,2')).toBe(true);
      expect(byKey.has('2,0')).toBe(true);
      expect(byKey.has('2,1')).toBe(true);
      expect(byKey.has('2,2')).toBe(true);
    });

    it('does not reveal disconnected zero region', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0],
      ];
      const result = getCellsToReveal(0, 0, field, 3, 3);
      expect(result.hitMine).toBe(false);
      // Only (0,0) and its border (0,1), (1,0), (1,1) - no, (1,1) is 1 so border. So (0,0), (0,1), (1,0), (1,1)
      expect(result.cells).toHaveLength(4);
      const byKey = new Set(result.cells.map((c) => `${c.row},${c.col}`));
      expect(byKey.has('0,0')).toBe(true);
      expect(byKey.has('0,1')).toBe(true);
      expect(byKey.has('1,0')).toBe(true);
      expect(byKey.has('1,1')).toBe(true);
      expect(byKey.has('2,0')).toBe(false);
      expect(byKey.has('0,2')).toBe(false);
    });

    it('stops at mines (does not add mine to cells)', () => {
      const field: MinesweeperCellValueDisplay[][] = [
        [0, 0, 0],
        [0, 'MINE', 0],
        [0, 0, 0],
      ];
      const result = getCellsToReveal(0, 0, field, 3, 3);
      expect(result.hitMine).toBe(false);
      // All 8 zeros revealed; mine at (1,1) not included
      expect(result.cells).toHaveLength(8);
      const minePos = result.cells.find((c) => c.row === 1 && c.col === 1);
      expect(minePos).toBeUndefined();
    });
  });
});
