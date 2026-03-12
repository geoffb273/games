import { findConnections } from '@/utils/hashi/connections';

describe('findConnections', () => {
  it('returns empty array for no islands', () => {
    expect(findConnections([])).toEqual([]);
  });

  it('returns empty array for a single island', () => {
    expect(findConnections([{ row: 0, col: 0 }])).toEqual([]);
  });

  describe('horizontal connections (same row)', () => {
    it('connects two islands on the same row with no island between', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
      ];
      expect(findConnections(islands)).toEqual([{ a: 0, b: 1, isHorizontal: true }]);
    });

    it('does not connect two islands when another island lies between them on the row', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      const result = findConnections(islands);
      expect(result).not.toContainEqual({ a: 0, b: 2, isHorizontal: true });
      expect(result).toContainEqual({ a: 0, b: 1, isHorizontal: true });
      expect(result).toContainEqual({ a: 1, b: 2, isHorizontal: true });
    });

    it('connects only adjacent pairs in a row of three (middle blocks 0-2)', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
      ];
      expect(findConnections(islands)).toEqual(
        expect.arrayContaining([
          { a: 0, b: 1, isHorizontal: true },
          { a: 1, b: 2, isHorizontal: true },
        ]),
      );
      expect(findConnections(islands)).toHaveLength(2);
    });
  });

  describe('vertical connections (same column)', () => {
    it('connects two islands on the same column with no island between', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 2, col: 0 },
      ];
      expect(findConnections(islands)).toEqual([{ a: 0, b: 1, isHorizontal: false }]);
    });

    it('does not connect two islands when another island lies between them on the column', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 1, col: 0 },
        { row: 2, col: 0 },
      ];
      const result = findConnections(islands);
      expect(result).not.toContainEqual({ a: 0, b: 2, isHorizontal: false });
      expect(result).toContainEqual({ a: 0, b: 1, isHorizontal: false });
      expect(result).toContainEqual({ a: 1, b: 2, isHorizontal: false });
    });
  });

  describe('grid with both horizontal and vertical', () => {
    it('finds all valid connections in a 2x2 grid', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 0, col: 2 },
        { row: 2, col: 0 },
        { row: 2, col: 2 },
      ];
      expect(findConnections(islands)).toEqual(
        expect.arrayContaining([
          { a: 0, b: 1, isHorizontal: true },
          { a: 2, b: 3, isHorizontal: true },
          { a: 0, b: 2, isHorizontal: false },
          { a: 1, b: 3, isHorizontal: false },
        ]),
      );
      expect(findConnections(islands)).toHaveLength(4);
    });

    it('omits blocked connections when an island is in between', () => {
      const islands = [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
        { row: 0, col: 2 },
        { row: 1, col: 1 },
        { row: 2, col: 0 },
        { row: 2, col: 2 },
      ];
      const result = findConnections(islands);
      // 0-2 on row 0 are blocked by island 1
      expect(result).not.toContainEqual({ a: 0, b: 2, isHorizontal: true });
      // 0-4 and 2-5 on col 0 and col 2 are not blocked; 4-5 would need same row/col
      expect(result).toContainEqual({ a: 0, b: 1, isHorizontal: true });
      expect(result).toContainEqual({ a: 1, b: 2, isHorizontal: true });
      expect(result).toContainEqual({ a: 0, b: 4, isHorizontal: false });
      expect(result).toContainEqual({ a: 2, b: 5, isHorizontal: false });
    });
  });

  it('uses lower index as a and higher as b in each connection', () => {
    const islands = [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ];
    const result = findConnections(islands);
    expect(result).toHaveLength(1);
    expect(result[0].a).toBe(0);
    expect(result[0].b).toBe(1);
  });
});
