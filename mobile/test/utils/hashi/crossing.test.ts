import type { HashiConnection } from '@/utils/hashi/connections';
import { doBridgesCross, wouldNewBridgeCrossExisting } from '@/utils/hashi/crossing';

describe('doBridgesCross', () => {
  it('returns false for two horizontal segments on different rows', () => {
    const islands = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ];
    const h1: HashiConnection = { a: 0, b: 1, isHorizontal: true };
    const h2: HashiConnection = { a: 2, b: 3, isHorizontal: true };
    expect(doBridgesCross(h1, h2, islands)).toBe(false);
  });

  it('returns false for two vertical segments on different cols', () => {
    const islands = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ];
    const v1: HashiConnection = { a: 0, b: 2, isHorizontal: false };
    const v2: HashiConnection = { a: 1, b: 3, isHorizontal: false };
    expect(doBridgesCross(v1, v2, islands)).toBe(false);
  });

  it('returns true for horizontal and vertical segments that intersect in the interior', () => {
    const islands = [
      { row: 0, col: 1 },
      { row: 2, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
    ];
    const horizontal: HashiConnection = { a: 2, b: 3, isHorizontal: true };
    const vertical: HashiConnection = { a: 0, b: 1, isHorizontal: false };
    expect(doBridgesCross(horizontal, vertical, islands)).toBe(true);
  });

  it('returns false when segments meet at an island (endpoint touch)', () => {
    const islands = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
    ];
    const horizontal: HashiConnection = { a: 0, b: 1, isHorizontal: true };
    const vertical: HashiConnection = { a: 0, b: 2, isHorizontal: false };
    expect(doBridgesCross(horizontal, vertical, islands)).toBe(false);
  });
});

describe('wouldNewBridgeCrossExisting', () => {
  it('returns true when adding a bridge would cross an existing bridge', () => {
    const islands = [
      { row: 0, col: 1 },
      { row: 2, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
    ];
    const connections: HashiConnection[] = [
      { a: 0, b: 1, isHorizontal: false },
      { a: 2, b: 3, isHorizontal: true },
    ];
    const bridgeCounts = [1, 0];
    expect(wouldNewBridgeCrossExisting(1, connections, bridgeCounts, islands)).toBe(true);
  });

  it('returns false when adding a bridge would not cross any existing bridge', () => {
    const islands = [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ];
    const connections: HashiConnection[] = [
      { a: 0, b: 1, isHorizontal: true },
      { a: 2, b: 3, isHorizontal: true },
    ];
    const bridgeCounts = [1, 0];
    expect(wouldNewBridgeCrossExisting(1, connections, bridgeCounts, islands)).toBe(false);
  });
});
